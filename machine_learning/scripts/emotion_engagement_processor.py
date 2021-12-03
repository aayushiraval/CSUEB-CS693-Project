import logging
from pathlib import Path

import cv2
import numpy as np
from keras.models import load_model

from utils.datasets import get_labels, preprocess_input
from utils.inference import apply_offsets, predict_engagement, detect_faces, draw_bounding_box, \
    draw_text, \
    load_detection_model, ENGAGEMENT_THRESHOLD

ENGAGED = 'Engaged'
NOT_ENGAGED = 'Not Engaged'


def process_image(image):
    """
    Args :
        image (BytesIO)
    """

    try:
        # parameters for loading data and images
        detection_model_path = './saved_models/detection_models/haarcascade_frontalface_default.xml'
        emotion_model_path = './saved_models/emotion_models/fer2013_emotion_detection_CNN.102-0.66.hdf5'
        emotion_labels = get_labels()

        # bounding box shape
        emotion_offsets = (0, 0)

        # loading models
        face_detection = load_detection_model(detection_model_path)
        emotion_model = load_model(emotion_model_path, compile=False)

        emotion_target_size = emotion_model.input_shape[1:3]

        # loading images
        image_array = np.fromstring(image, np.uint8)
        unchanged_image = cv2.imdecode(image_array, cv2.IMREAD_UNCHANGED)

        rgb_image = cv2.cvtColor(unchanged_image, cv2.COLOR_BGR2RGB)
        gray_image = cv2.cvtColor(unchanged_image, cv2.COLOR_BGR2GRAY)

        faces = detect_faces(face_detection, gray_image)
        for face_coordinates in faces:
            x1, x2, y1, y2 = apply_offsets(face_coordinates, emotion_offsets)
            gray_face = gray_image[y1:y2, x1:x2]

            try:
                gray_face = cv2.resize(gray_face, emotion_target_size)
            except Exception as e:
                logging.warning(e)
                continue

            gray_face = preprocess_input(gray_face, True)
            gray_face = np.expand_dims(gray_face, 0)
            gray_face = np.expand_dims(gray_face, -1)
            emotion_prediction = emotion_model.predict(gray_face)
            emotion_label_index = np.argmax(emotion_prediction)
            emotion_percentage = round(emotion_prediction[emotion_label_index], 4) * 100
            emotion_text = emotion_labels[emotion_label_index]
            engagement_score = predict_engagement(emotion_text, emotion_percentage)

            if engagement_score >= ENGAGEMENT_THRESHOLD:
                engagement_text = ENGAGED
                color = (0, 0, 255)  # Blue
            else:
                engagement_text = NOT_ENGAGED
                color = (255, 0, 0)  # Red

            draw_bounding_box(face_coordinates, rgb_image, color)
            draw_text(face_coordinates, rgb_image, engagement_text, color, 0, -20, 1, 2)
            draw_text(face_coordinates, rgb_image, emotion_text, color, 0, -50, 1, 2)
    except Exception as err:
        logging.error(f'Error processing image : {err}')

    bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)

    output_dir = Path('output')
    output_dir.mkdir(exist_ok=True)
    cv2.imwrite(Path(output_dir, 'output_image.png'), bgr_image)
