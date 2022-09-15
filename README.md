## Serverless Crowdsale API

Serverless framework that lets you automatically run backend code using [Google Cloud Functions](https://firebase.google.com/docs/functions) for generating merkle proofs for allow-listed addresses in a crowdsale Solidity contract and other miscellaneous server functions. 



### Building and Deployment

```
git clone git@github.com:co-museum/crowdsale-api.git
cd crowdsale-api
yarn
cd funtions
yarn build
yarn deploy
```


### Test Scripts

```
cd functions
yarn test:emulators 
yarn test
```

or 

```
cd functions
yarn test:ci
```
