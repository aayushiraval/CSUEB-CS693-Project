from keras.layers import Activation, Convolution2D, Dropout
from keras.layers import AveragePooling2D, BatchNormalization
from keras.layers import GlobalAveragePooling2D
from keras.models import Sequential


def emotion_detection_CNN(input_shape, num_classes):
    network = Sequential()
    network.add(Convolution2D(filters=16, kernel_size=(7, 7), padding='same',
                            name='image_array', input_shape=input_shape))
    network.add(BatchNormalization())
    network.add(Convolution2D(filters=16, kernel_size=(7, 7), padding='same'))
    network.add(BatchNormalization())
    network.add(Activation('relu'))
    network.add(AveragePooling2D(pool_size=(2, 2), padding='same'))
    network.add(Dropout(.5))

    network.add(Convolution2D(filters=32, kernel_size=(5, 5), padding='same'))
    network.add(BatchNormalization())
    network.add(Convolution2D(filters=32, kernel_size=(5, 5), padding='same'))
    network.add(BatchNormalization())
    network.add(Activation('relu'))
    network.add(AveragePooling2D(pool_size=(2, 2), padding='same'))
    network.add(Dropout(.5))

    network.add(Convolution2D(filters=64, kernel_size=(3, 3), padding='same'))
    network.add(BatchNormalization())
    network.add(Convolution2D(filters=64, kernel_size=(3, 3), padding='same'))
    network.add(BatchNormalization())
    network.add(Activation('relu'))
    network.add(AveragePooling2D(pool_size=(2, 2), padding='same'))
    network.add(Dropout(.5))

    network.add(Convolution2D(filters=128, kernel_size=(3, 3), padding='same'))
    network.add(BatchNormalization())
    network.add(Convolution2D(filters=128, kernel_size=(3, 3), padding='same'))
    network.add(BatchNormalization())
    network.add(Activation('relu'))
    network.add(AveragePooling2D(pool_size=(2, 2), padding='same'))
    network.add(Dropout(.5))

    network.add(Convolution2D(filters=256, kernel_size=(3, 3), padding='same'))
    network.add(BatchNormalization())
    network.add(Convolution2D(
        filters=num_classes, kernel_size=(3, 3), padding='same'))
    network.add(GlobalAveragePooling2D())
    network.add(Activation('softmax', name='predictions'))
    return network


if __name__ == "__main__":
    input_shape = (64, 64, 1)
    model = emotion_detection_CNN(input_shape, num_classes=7)
    model.summary()
