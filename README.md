# Platogo Coding Challenge

## Description

The coding challenge description can be found within the following file.

```
docs/Platogo Developer Challenge - Client - with provided Template.pdf
```

## Compile and start

1. Start the backend with version `~1.0.1` from the [`platogo-coding-challange-backend`][1] repo.
2. Run `npm start`

[1]: https://github.com/gernotpokorny/platogo-coding-challenge-backend

## Run the tests

## Unit and Integration Tests

1. Run `npm run test`

## E2E Tests

1. `git clone` the backend with version `~1.0.1` from the  [`platogo-coding-challange-backend`][1] repo
2. Run `npm run build`
3. Run `docker build .` within the root of the in step 1 cloned [`platogo-coding-challange-backend`][1] repo and note the resulting image hash.
4. Copy `.env` to `.env.test.local`
5. Set the `REACT_APP_E2E_TEST_IMAGE_ID` within `.env.test.local` to the image hash which the `docker build` command provided at step 2.
6. Run `npm run test:e2e`

[1]: https://github.com/gernotpokorny/platogo-coding-challenge-backend

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), using the [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/) TS template.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
