const Hapi = require('hapi');

// init server and add connection
const server = Hapi.server({
  port: 3000,
  host: 'localhost'
});

const init = async () => {
  // home route
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return 'Hello World';
    }
  });

  // dynamic route
  server.route({
    method: 'GET',
    path: '/{name}',
    handler: (request, h) => {
      return 'Hello, ' + encodeURIComponent(request.params.name) + '!';
    }
  });

  // register inert middleware
  await server.register(require('inert'));

  // serving static content
  server.route({
    method: 'GET',
    path: '/about',
    handler: (request, h) => {
      return h.file('./public/about.html');
    }
  });

  server.route({
    method: 'GET',
    path: '/image',
    handler: (request, h) => {
      return h.file('./public/hapi.png');
    }
  });

  // register vision
  await server.register(require('vision'));

  const Handlebars = require('handlebars');

  // configure handlebars
  server.views({
    engines: { handlebars: Handlebars },
    relativeTo: __dirname,
    layoutPath: 'views/layout',
    layout: 'layout',
    path: './views'
  });

  server.route({
    method: 'GET',
    path: '/index',
    handler: (request, h) => {
      return h.view('index', {
        name: 'John Doe'
      });
    }
  });

  // configure mongoose
  const mongoose = require('mongoose');
  mongoose.connect(
    `mongodb://${process.env.MLAB_USER}:${
      process.env.MLAB_PASSWORD
    }@ds239940.mlab.com:39940/hapijs-demo-app`,
    error => {
      if (error) {
        console.log('Error in mlab connection : ' + error);
      }
      console.log('Connected to mlab');
    }
  );

  const TaskSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    text: String
  });

  const Task = mongoose.model('Task', TaskSchema);

  try {
    // tasks route
    server.route({
      method: 'GET',
      path: '/tasks',
      handler: async (request, h) => {
        let tasks = await Task.find();
        return h.view('tasks', {
          tasks: tasks
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/tasks',
      handler: (request, h) => {
        const task = new Task({
          _id: new mongoose.Types.ObjectId(),
          text: request.payload.text
        });
        task.save();
        return h.redirect('/tasks');
      }
    });

    server.route({
      method: 'POST',
      path: '/tasks/delete/{taskId}',
      handler: async (request, h) => {
        await Task.findByIdAndRemove(request.params.taskId).exec();
        return h.redirect('/tasks');
      }
    });
  } catch (error) {
    console.log('Error : ' + error);
  }

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

// start server
init();
