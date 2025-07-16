#!/usr/bin/env bash
set -euo pipefail

# This whole script exists because all the options for tar are different on different systems.
# We could have had it all...
echo "Starting trackbear-help zip:"

# cd into the .vitepress directory (because not all tars let you strip leading path components)
echo "Moving into .vitepress directory..."
cd ./help-docs/.vitepress
# copy the built help docs over to a better-named directory (because not all tars let you s/// filenames)
echo "Copying dist to help-docs..."
cp -r ./dist ./trackbear-help
# make the archive (this one ought to be pretty standard)
echo "Creating archive at trackbear-help.tar.gz..."
tar -czf ./trackbear-help.tar.gz ./trackbear-help/**/*.* ./trackbear-help/*.*
# remove the copy
echo "Removing trackbear-help copy..."
rm -rf ./trackbear-help
# get back out to where we were supposed to be
echo "Getting the heck out of Dodge..."
cd -

echo "trackbear-help zip complete!"