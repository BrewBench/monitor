#!/bin/bash
cd "$(dirname "$0")"
sed -i -e 's/fa-book/fa-book-spells/g' ../build/views/header.html
sed -i -e 's/use\.fontawesome\.com/pro\.fontawesome\.com/g' ../build/index.html
sed -i -e 's/Font\ Awesome\ 5\ Free/Font\ Awesome\ 5\ Pro/g' ../build/styles/app.css
