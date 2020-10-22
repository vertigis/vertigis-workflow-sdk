This project was bootstrapped with the [Geocortex Workflow SDK](https://github.com/geocortex/vertigis-workflow-sdk). Before you can use your activity pack in the [Geocortex Workflow Designer](https://apps.geocortex.com/workflow/designer/), you will need to [register the activity pack](https://developers.geocortex.com/docs/workflow/sdk-web-overview#register-the-activity-pack).

## Available Scripts

Inside the newly created project, you can run some built-in commands:

### `npm run generate`

Interactively generate a new activity or form element.

### `npm start`

Runs the project in development mode. Your activity pack will be available at [http://localhost:5000/main.js](http://localhost:5000/main.js). The HTTPS certificate of the development server is a self-signed certificate that web browsers will warn about. To work around this open [`https://localhost:5000/main.js`](https://localhost:5000/main.js) in a web browser and allow the invalid certificate as an exception. For creating a locally-trusted HTTPS certificate see the [Configuring a HTTPS Certificate](#configuring-a-https-certificate) section.

### `npm run build`

Builds the activity pack for production to the `build` folder. It optimizes the build for the best performance.

Your custom activity pack is now ready to be deployed!

See the [section about deployment](https://developers.geocortex.com/docs/workflow/sdk-web-overview/#deployment) in the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/) for more information.

## Configuring a HTTPS Certificate

You can create a locally-trusted development certificate that is trusted by your system using the [mkcert](https://github.com/FiloSottile/mkcert) utility. Once installed you can run:

```sh
$ mkcert -install
Created a new local CA at "/Users/ian/Library/Application Support/mkcert" 💥
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox trust store (requires browser restart)! 🦊

$ mkcert localhost 127.0.0.1 ::1
Using the local CA at "/Users/ian/Library/Application Support/mkcert" ✨

Created a new certificate valid for the following names 📜
 - "localhost"
 - "127.0.0.1"
 - "::1"

The certificate is at "./localhost+2.pem" and the key at "./localhost+2-key.pem" ✅
```

Once you've created your locally-trusted development certificate you can provide the paths to the `cert`, `key`, and `ca` files:

```sh
$ npm start -- \
--key "/Users/ian/Library/Application Support/mkcert/localhost+2-key.pem" \
--cert "/Users/ian/Library/Application Support/mkcert/localhost+2.pem" \
--ca "/Users/ian/Library/Application Support/mkcert/rootCA.pem"
```

Note the extra `--` used in the `npm start` script is necessary to forward the arguments to the development server process.

## Documentation

Find [further documentation on the SDK](https://developers.geocortex.com/docs/workflow/sdk-web-overview/) on the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/)
