declare var blazeface: any;

import {
    VideoFrameBuffer,
    VideoFrameProcessor,
} from 'amazon-chime-sdk-js';

var CANVAS_FACE_GREY = document.createElement('canvas');
CANVAS_FACE_GREY.width = 64;
CANVAS_FACE_GREY.height = 64;
var CANVAS_FACE_GREY_CTX = CANVAS_FACE_GREY.getContext('2d');
var CANVAS_FACE = document.createElement('canvas');
CANVAS_FACE.width = 64;
CANVAS_FACE.height = 64;
var CANVAS_FACE_CTX = CANVAS_FACE.getContext('2d');

var MODEL_EMOTION: { predict: (arg0: any) => any; };

var ENGAGEMENT_INDEX_THRESHOLD = 0.40;
var EMOTION_WEIGHTS = {
  'Angry': 0.27,
  'Disgust': 0.20,
  'Fear': 0.30,
  'Happy': 0.79,
  'Sad': 0.40,
  'Surprise': 0.70,
  'Neutral': 0.95
}
var LABEL_EMOTIONS = {
    0: 'Angry',
    1: 'Disgust',
    2: 'Fear',
    3: 'Happy',
    4: 'Sad',
    5: 'Surprise',
    6: 'Neutral'
};

function preprocess_input(im: Object): Object {
    // @ts-ignore
    var img = tf.browser.fromPixels(im, 1).toFloat()
    // @ts-ignore
    var offset = tf.scalar(255);
    // @ts-ignore
    var x1 = tf.scalar(0.5);
    // @ts-ignore
    var x2 = tf.scalar(2);
    var normalized = img.div(offset).sub(x1).mul(x2);
    var batched = normalized.reshape([1, 64, 64, 1]);
    return batched;
}

function predictEmotion(input: Object) {
    var r = MODEL_EMOTION.predict(input);
    var result = r.dataSync();
    // @ts-ignore
    var tresult = tf.tensor(result)
    // @ts-ignore
    var label_index = tf.argMax(tresult).dataSync()[0]
    var label_percent = result[label_index].toFixed(4) * 100;
    // @ts-ignore
    return {"result": result, "label": LABEL_EMOTIONS[label_index], "percent": label_percent};
}

function cropFace(rect: { topLeft: number[]; bottomRight: number[]; }, videoCanvas: CanvasImageSource) {

    var x = rect.topLeft[0];
    var y = rect.topLeft[1];

    var w = rect.bottomRight[0] - rect.topLeft[0];
    var h = rect.bottomRight[1] - rect.topLeft[1];

    CANVAS_FACE_CTX.drawImage(videoCanvas, x, y, w, h, 0, 0, 64, 64);

    //Convert Image to Greyscale
    var imageData = CANVAS_FACE_CTX.getImageData(0, 0, CANVAS_FACE.width, CANVAS_FACE.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    CANVAS_FACE_GREY_CTX.putImageData(imageData, 0, 0);
}

export default class SegmentationProcessor implements VideoFrameProcessor {
    static ATTENTION_COLOR = "rgba(0, 255, 0, 0.1)";
    static DISTRACTED_COLOR = "rgba(255, 0, 0, 0.2)"


    private model: any | undefined = undefined;

    constructor() {
    }

    async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
        // Load the model.
        if (!this.model) {
            // @ts-ignore
            MODEL_EMOTION = await tf.loadLayersModel("https://raw.githubusercontent.com/aayushiraval/CS693-models/main/model/model.json");
            this.model = await blazeface.load();
        }
        const inputCanvas = buffers[0].asCanvasElement();
        if (!inputCanvas) {
            throw new Error('buffer is already destroyed');
        }

        const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
        const annotateBoxes = false;
        let predictions = await this.model.estimateFaces(inputCanvas, returnTensors);

        /*
        `predictions` is an array of objects describing each detected face, for example:

        [
          {
            topLeft: [232.28, 145.26],
            bottomRight: [449.75, 308.36],
            probability: [0.998],
            landmarks: [
              [295.13, 177.64], // right eye
              [382.32, 175.56], // left eye
              [341.18, 205.03], // nose
              [345.12, 250.61], // mouth
              [252.76, 211.37], // right ear
              [431.20, 204.93] // left ear
            ]
          }
        ]
        */
        if (predictions.length > 0) {
            var ctx = inputCanvas.getContext("2d");
            ctx.font = "25px Arial";
            for (let i = 0; i < predictions.length; i++) {
                // ctx.fillText(predictions[i].probability[0], 10, 50);
                if (returnTensors) {
                    predictions[i].topLeft = predictions[i].topLeft.arraySync();
                    predictions[i].bottomRight = predictions[i].bottomRight.arraySync();
                    if (annotateBoxes) {
                        predictions[i].landmarks = predictions[i].landmarks.arraySync();
                    }
                }

                const start = predictions[i].topLeft;
                const end = predictions[i].bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];
                // if (String(predictions[i].probability[0]).substring(0,5) < 0.989) {
                //     ctx.fillStyle = SegmentationProcessor.DISTRACTED_COLOR;
                // } else {
                //   ctx.fillStyle = SegmentationProcessor.ATTENTION_COLOR;
                // }
                // ctx.fillStyle = 'rgba(76,169,235,0)';
                ctx.strokeStyle = '#4ca9eb';
                ctx.strokeRect(start[0], start[1], size[0], size[1]);
                // ctx.strokeStyle = '#4ca9eb';
                // ctx.strokeRect(start[0], start[1], size[0], size[1]); // face

                cropFace(predictions[i], inputCanvas);

                var input = preprocess_input(CANVAS_FACE_GREY);

                // do not use `await` to avoid blocking page loading
                var result = predictEmotion(input);
                // ctx.fillText(result.label, 10, 50);

                // @ts-ignore
                var engagement_score = (result.percent / 100.0 * EMOTION_WEIGHTS[result.label]).toPrecision(3);
                engagement_score = parseFloat(engagement_score).toFixed(3);

                // @ts-ignore
                if (engagement_score >= ENGAGEMENT_INDEX_THRESHOLD) {
                    ctx.fillStyle = "green";
                    ctx.fillText(result.label.concat(', Engaged:' + engagement_score), 10, 90);
                } else {
                    ctx.fillStyle = "red";
                    ctx.fillText(result.label.concat(', Not Engaged:' + engagement_score), 10, 90);
                }

                // if (annotateBoxes) {
                //   const landmarks = predictions[i].landmarks;
                //
                //   ctx.fillStyle = "blue";
                //   for (let j = 0; j < landmarks.length - 4; j++) {
                //     const x = landmarks[j][0];
                //     const y = landmarks[j][1];
                //     ctx.fillRect(x, y, 5, 5);
                //   }
                // }
            }
        }
        return buffers;
    }

    async destroy(): Promise<void> {
        if (this.model) {
            this.model.dispose();
        }
        this.model = undefined;
    }
}
