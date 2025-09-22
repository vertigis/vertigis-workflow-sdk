# VertiGIS Studio Workflow SDK

![CI/CD](https://github.com/vertigis/vertigis-workflow-sdk/workflows/CI/CD/badge.svg)
[![npm](https://img.shields.io/npm/v/@vertigis/workflow-sdk)](https://www.npmjs.com/package/@vertigis/workflow-sdk)

This SDK makes it easy to create custom activity packs for [VertiGIS Studio Workflow](https://www.vertigisstudio.com/products/vertigis-studio-workflow/).

## Requirements

- The latest LTS version of [Node.js](https://nodejs.org/en/download/)
- A code editor of your choice. We recommend [Visual Studio Code](https://code.visualstudio.com/)
- A viewer using VertiGIS Studio Workflow 5.31 or later ([VertiGIS Product Installer Downloads](https://apps.vertigisstudio.com/downloads))
    - VertiGIS Studio Web 5.22 or later
    - Workflow 5.31 widget for ArcGIS Experience Builder or later

## Creating a new project

To create a project called _activity-pack_ run this command:

```sh
npx @vertigis/workflow-sdk@latest create activity-pack
```

This will bootstrap a new project in the specified directory to quickly get you up and running with the VertiGIS Studio Workflow SDK. Before you can use your activity pack in the [VertiGIS Studio Workflow Designer](https://apps.vertigisstudio.com/workflow/designer/), you will need to [register the activity pack](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview#register-the-activity-pack).

## Available Scripts

Inside the newly created project, you can run some built-in commands:

### `npm run generate`

Interactively generate a new activity or form element.

### `npm start`

Runs the project in development mode. By default, Your activity pack will be available at [http://localhost:5000/main.js](http://localhost:5000/main.js). The HTTPS certificate of the development server is a self-signed certificate that web browsers will warn about. To work around this open [`https://localhost:5000/main.js`](https://localhost:5000/main.js) in a web browser and allow the invalid certificate as an exception. For creating a locally-trusted HTTPS certificate see the [Configuring a HTTPS Certificate](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/#configuring-a-https-certificate) section on the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/).

#### Command Line Arguments

The `start` script supports the following arguments that are passed along to [webpack-dev-server](https://github.com/webpack/webpack-dev-server/tree/main?tab=readme-ov-file).

- `--host` - Default is `localhost`. [[docs](https://github.com/webpack/webpack-dev-server/blob/main/DOCUMENTATION-v4.md#devserverhost)]
- `--allowed-hosts` - Default is `all`. [[docs](https://github.com/webpack/webpack-dev-server/blob/main/DOCUMENTATION-v4.md#devserverallowedhosts)]

NOTE: It is important to add `--` before the list of parameters.

Example:

```sh
npm start -- --host 0.0.0.0 --allowed-hosts auto
```

### `npm run build`

Builds the activity pack for production to the `build` folder. It optimizes the build for the best performance.

Your custom activity pack is now ready to be deployed!

See the [section about deployment](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/#deployment) in the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/) for more information.

## Documentation

Find [further documentation on the SDK](https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/) on the [VertiGIS Studio Developer Center](https://developers.vertigisstudio.com/docs/workflow/overview/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributing guidelines.
