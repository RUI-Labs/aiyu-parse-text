const express = require('express');
const cors = require('cors')
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);
const bodyParser = require('body-parser');

// const Metronom = require('metronom');

// const metronom = new Metronom.Metronom({
//   redisClientOptions: {
//     url: "redis://default:A38GqqOQuZEk7bgPzgbsN4Il3DBUl68j@redis-12925.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12925"
//   }
// });

const dJSON = require('dirty-json');

// const businessModel = metronom.define({
//   id: {
//     type: Metronom.Types.String,
//   },
//   type: {
//     type: Metronom.Types.String,
//   },
//   input_sample: {
//     type: Metronom.Types.String,
//   },
//   output_sample: {
//     type: Metronom.Types.String,
//   },
//   output_format: {
//     type: Metronom.Types.String,
//   },
//   extra_parameter: {
//     type: Metronom.Types.String,
//     default: ""
//   },
//   whisper_input_sample: {
//     type: Metronom.Types.String,
//     default: ""
//   },
//   whisper_output_sample: {
//     type: Metronom.Types.String,
//     default: ""
//   },
//   whisper_corrections: {
//     type: Metronom.Types.String,
//     default: ""
//   },
//   whisper_substitute: {
//     type: Metronom.Types.String,
//     default: ""
//   }
// },
//   'business',
//   {
//     keyUnique: 'id',
//     log: Metronom.LogLevels.All,
//   }
// );

const app = express();
app.use(cors());
app.use(bodyParser.json());


const connectionString = 'redis://default:A38GqqOQuZEk7bgPzgbsN4Il3DBUl68j@redis-12925.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12925';
const Redis = require('redis')
const client = Redis.createClient({
  url: connectionString
});

app.post('/', async (req, res) => {

  console.log("calling openai")

  let input = req.body.input
  let id = req.body.id

  // console.log(req.body)

  await client.connect();
  let businessData = await client.json.get(`business:${id}`)
  await client.disconnect();
  // let business = await businessModel.findById(id);
  // let businessData = JSON.parse(business.toJSON())
  // console.log(businessData.input_sample)

  let inputSample = businessData.input_sample
  let outputSample = businessData.output_sample
  let extraParameter = businessData.extra_parameter
  let outputFormat = businessData.output_format
  let businessType = businessData.type

  // console.clear()
  // console.log(businessData)
  // // console.log(`Example:\n\nInput:\n${inputSample}\n\nOutput:\n${outputSample}\n\n---\n\nThe text above is an order for a ${businessType}. For unspecified product quantity, assign it to 0. Extract the information into format like this\n\n${outputFormat}\n\nExtra Parameters:\n${extraParameter}\n\nInput:\n${input}\n\nOutput:\n`)

  // res.send(200)
  // return

  if (input) {

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Example:\n\nInput:\n${inputSample}\n\nOutput:\n${outputSample}\n\n---\n\nThe text above is an order for a ${businessType}. For unspecified product quantity, assign it to 0. Extract the information into format like this\n\n${outputFormat}\n\nExtra Parameters:\n${extraParameter}\n\nInput:\n${input}\n\nOutput (return a valid JSON.parsable JSON):\n`,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // const response = await openai.createCompletion({
    //   model: "davinci:ft-personal-2023-03-03-09-17-19",
    //   prompt: `Extra Parameters:\n${extraParameter}\n\nInput:\n${input}\n\nOutput (return a valid JSON.parsable JSON):\n`,
    //   temperature: 0.7,
    //   max_tokens: 256,
    //   top_p: 1,
    //   frequency_penalty: 0,
    //   presence_penalty: 0,
    // });


    let result = response.data.choices[0]["text"]

    console.clear()
    console.log(result)

    if (result != "INVALID INPUT") {
      result = dJSON.parse(result)
      console.log(result)
      result.product = result.product?.filter(p => p.quantity > 0)
    }
    res.send(result)
  } else {
    res.send(500, "No input detected")
  }



});

app.listen(3000, () => {
  console.log('server started');
});
