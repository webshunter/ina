import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Adapter, Resource, Database } from '@adminjs/sql';
import bcrypt from 'bcrypt';
import { ComponentLoader } from 'adminjs';
import pg from 'pg';

const componentLoader = new ComponentLoader();
const dashboardComponent = componentLoader.add('dashboard', './admin/components/dashboard');

AdminJS.registerAdapter({ Database, Resource });

// Pool for authentication
const pool = new pg.Pool({
  database: 'hubunk_db',
  host: '145.223.22.181',
  port: 5433,
  user: 'vds',
  password: 'VdsHubunk123',
  ssl: false
});

const start = async () => {
  const db = await new Adapter('postgresql', {
    database: 'hubunk_db',
    host: '145.223.22.181',
    port: 5433,
    user: 'vds',
    password: 'VdsHubunk123',
    ssl: false
  }).init();

  const resources = [
    {
      resource: db.table('users'),
      options: {
        properties: {
          password: {
            type: 'password',
            isVisible: { list: false, edit: true, filter: false, show: false },
          },
        },
        actions: {
          new: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  password: await bcrypt.hash(request.payload.password, 10),
                }
              }
              return request
            },
          },
          edit: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  password: await bcrypt.hash(request.payload.password, 10),
                }
              }
              return request
            },
          }
        }
      }
    },
    {
      resource: db.table('content'),
      options: {
        properties: {
          section: { isTitle: true, position: 1 },
          key: { position: 2 },
          value: { type: 'richtext', position: 3 },
          updated_at: { isVisible: { list: true, edit: false, show: true, filter: true } }
        }
      }
    },
    {
      resource: db.table('faqs'),
      options: {
        properties: {
          question: { isTitle: true, position: 1 },
          answer: { type: 'textarea', position: 2 },
          order_num: { position: 3 },
          is_active: { type: 'boolean', position: 4 },
          updated_at: { isVisible: { list: true, edit: false, show: true, filter: true } }
        }
      }
    },
    {
      resource: db.table('pricing'),
      options: {
        properties: {
          plan_name: { isTitle: true, position: 1 },
          description: { type: 'textarea', position: 2 },
          price: { type: 'number', position: 3 },
          features: { type: 'textarea', position: 4 },
          is_active: { type: 'boolean', position: 5 },
          updated_at: { isVisible: { list: true, edit: false, show: true, filter: true } }
        }
      }
    },
    { resource: db.table('consultations'), options: {} },
    { resource: db.table('chat_messages'), options: {} },
    { resource: db.table('reports'), options: {} },
    { resource: db.table('subscriptions'), options: {} },
    { resource: db.table('payments'), options: {} }
  ];

  const admin = new AdminJS({
    resources,
    rootPath: '/admin',
    branding: {
      companyName: 'Hubunk AI Coach',
      logo: '/public/logo.png',
      favicon: '/public/favicon.ico',
      theme: {
        colors: {
          primary100: '#1a7f64',
          primary80: '#1a7f64',
          primary60: '#1a7f64',
          primary40: '#1a7f64',
          primary20: '#1a7f64',
        },
      },
      softwareBrothers: false
    },
    dashboard: { component: dashboardComponent },
    componentLoader,
  });

  if (process.env.NODE_ENV === 'development') {
    admin.watch();
  }

  // Custom authentication
  const router = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'admin']);
      const user = result.rows[0];
      if (user && await bcrypt.compare(password, user.password)) {
        return { email: user.email, role: user.role };
      }
      return null;
    },
    cookiePassword: process.env.SESSION_SECRET || 'your-secret-key',
  });

  return { admin, router };
};

export default start; 