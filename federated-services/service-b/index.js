const request = require('request-promise-native');
const {buildFederatedSchema} = require('@apollo/federation');
const {ApolloServer, gql} = require('apollo-server-express');
const express = require('express');
const app = express();
const {json} = require('body-parser');

const typeDefs = gql`
	type Query {
		hola: String
		world: String
	}
`;

typeDefs.toString = function () {
    return this.loc.source.body;
};

const resolvers = {
    Query: {
        hola: () => 'Hola!',
        world: () => 'World!',
    },
};

const server = new ApolloServer({schema: buildFederatedSchema([{typeDefs, resolvers}])});

const graphPort = 3000;
const serviceUrl = `${process.env.SERVICE_HOST}:${graphPort}`;

const router = express.Router();
app.use(router);
router.use(json());
server.applyMiddleware({app});

app.listen({port: graphPort}, () => {console.log(`🚀 Server ready at ${serviceUrl}`);});

(async () => {
    try {
        await request({
            timeout: 5000,
            baseUrl: process.env.SCHEMA_REGISTRY_URL,
            url: '/schema/push',
            method: 'POST',
            json: true,
            body: {
                name: process.env.SERVICE_NAME,
                version: 'latest',
                type_defs: typeDefs.toString(),
                url: serviceUrl,
            },
        });
        console.info('Schema registered successfully!');
    } catch (err) {
        console.error(`Schema registration failed: ${err.message}`);
    }
})();
