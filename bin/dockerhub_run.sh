FILE=Gemfile.lock
if [ -f "$FILE" ]; then
    rm $FILE
fi
docker run --rm -v "$PWD:/home/shaocr/shaocr-cv.github.io" -p "8080:8080" \
                    -it amirpourmand/al-folio bundler  \
                    exec jekyll serve --watch --port=8080 --host=127.0.0.1 
