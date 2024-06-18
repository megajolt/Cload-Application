const amqp = require('amqplib')

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUrl = `amqp://${rabbitmqHost}`

let _channel

const queueName = "photos"

exports.queueName = queueName

exports.connectToRabbitMQ = async function () {
      try {
        const connection = await amqp.connect(rabbitmqUrl);
        _channel = await connection.createChannel();
        await _channel.assertQueue(queueName);
        console.log("Connected to RabbitMQ");
    } catch (err) {
        console.error("Error connecting to RabbitMQ:", err);
    }
  }
  
  exports.getChannel = function () {
    return _channel
  }