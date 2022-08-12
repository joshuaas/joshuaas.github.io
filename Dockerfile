FROM jekyll/jekyll
Label MAINTAINER Amir Pourmand
#install imagemagick tool for convert command
RUN apk add --no-cache --virtual .build-deps \
        libxml2-dev \
        shadow \
        autoconf \
        g++ \
        make \
    && apk add --no-cache imagemagick-dev imagemagick
WORKDIR /home/shaocr/shaocr-cv.github.io/
ADD Gemfile /home/shaocr/shaocr-cv.github.io/
RUN bundle install
