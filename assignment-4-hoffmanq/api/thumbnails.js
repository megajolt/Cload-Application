const amqp = require("amqplib")
const jimp = require("jimp")
const { connectToDb } = require("../lib/mongo")
const { getPhotoById } = require("../models/photo.js")
const { queueName } = require("../lib/rabbitmq.js")

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUrl = `amqp://${rabbitmqHost}`

async function main() {
  try {
    await connectToDb()
    console.log("Attempting to connect to RabbitMQ...");
    const connection = await amqp.connect(rabbitmqUrl);
    console.log("RabbitMQ connection established successfully.");

    console.log("Creating channel...");
    const channel = await connection.createChannel();
    console.log("Channel created successfully.");
    await channel.assertQueue(queueName)


    channel.consume(queueName, async (msg) => {
      console.log("Received message:", msg.content.toString())
      if (msg) {
        const id = msg.content.toString()
        const img = await getPhotoById(id)

        console.log("Image", img)

        try {
              const lenna = await jimp.read(img.path)
              const thumbnailFileName = `${img.filename.replace('.png', '.jpg')}`
              const thumbnailPath = `${__dirname}/uploads/thumbs/${thumbnailFileName}`
              await lenna.quality(100).resize(100, 100).write(thumbnailPath)
              console.log("Thumbnail created successfully:", thumbnailPath)
              channel.ack(msg)
            } catch (err) {
              console.error("Error resizing image:", err)
              channel.nack(msg)
            }
          }
        })
  } catch (e) {
    console.error("Error", e)
  }
}

main()