# Create and configure folders
mkdir -p module-services/claims-processing/client/public
touch module-services/claims-processing/client/public/favicon.ico
mkdir -p module-services/claims-processing/client/src/assets
mkdir -p module-services/claims-processing/client/src/components

# Create .browserlistrc file
cat > module-services/claims-processing/client/.browserlistrc << 'EOL'
> 1%
last 2 versions
not dead
not ie 11
EOL

# Create babel.config.js
cat > module-services/claims-processing/client/babel.config.js << 'EOL'
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ]
}
EOL

echo "Claims Processing Client structure created successfully!"