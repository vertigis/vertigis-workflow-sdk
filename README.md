# Geocortex Workflow SDK

![CI/CD](https://github.com/geocortex/vertigis-workflow-sdk/workflows/CI/CD/badge.svg)

This SDK makes it easy to create custom activity packs for [Geocortex Workflow](https://www.geocortex.com/products/geocortex-workflow/).

## Requirements

-   Geocortex Workflow 5.18 or later if running on-premises
-   The latest LTS version of [Node.js](https://nodejs.org/en/download/)
-   A code editor of your choice. We recommend [Visual Studio Code](https://code.visualstudio.com/)

## Creating a new project

To create a project called _workflow-library_ run this command:

```sh
npx @vertigis/workflow-sdk create workflow-library
```

This will bootstrap a new project in the specified directory to quickly get you up and running with the Geocortex Workflow SDK. Before you can use your activity pack in the [Geocortex Workflow Designer](https://apps.geocortex.com/workflow/designer/), you will need to [register the activity pack](https://developers.geocortex.com/docs/workflow/sdk-web-overview#register-the-activity-pack).

## Available Scripts

Inside the newly created project, you can run some built-in commands:

### `npm run generate`

Interactively generate a new activity or form element.

### `npm start`

Runs the project in development mode. Your activity pack will be available at [http://localhost:5000/main.js](http://localhost:5000/main.js).

### `npm run build`

Builds the activity pack for production to the `build` folder. It optimizes the build for the best performance.

Your custom activity pack is now ready to be deployed!

See the [section about deployment](https://developers.geocortex.com/docs/workflow/sdk-web-overview/#deployment) in the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/) for more information.

## Documentation

Find [further documentation on the SDK](https://developers.geocortex.com/docs/workflow/sdk-web-overview/) on the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributing guidelines.
