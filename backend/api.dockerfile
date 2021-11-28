# Use the Python 3.9.6-slim:latest base image.
FROM python:3.9.6-slim

# install gcc, make and git
RUN apt-get update \
&& apt-get install gcc -y \
&& apt-get install -y git \
&& apt-get clean

# Makes use of Docker’s layer caching and skip installing
# Python requirements if the requirements.txt file was not changed.
RUN pip3 install --upgrade pip
COPY requirements/ /backend/requirements
RUN pip3 install -r /backend/requirements/common.txt
# Add backend directory to the Docker source.
ADD . /backend

# Switch to the backend directory.
WORKDIR /backend
