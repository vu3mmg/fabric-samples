'use strict';
/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/*
 * Chaincode Invoke
 */

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var fs = require('fs');
var superagent = require('superagent');
var agent = require('superagent-promise')(require('superagent'), Promise);

var fabric_client = new Fabric_Client();

var channel = fabric_client.newChannel('testchainid');
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);
var order = fabric_client.newOrderer('grpc://localhost:7050')
channel.addOrderer(order);

let key = fs.readFileSync("../basic-network/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore/1deeab5433fa6e5f045eb763109d6165268fba153211af1281f00d45f54b1022_sk");
let cert = fs.readFileSync("../basic-network/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts/Admin@example.com-cert.pem");


var member_user = null;
var store_path = path.join(__dirname, 'hfc-key-store');
//console.log('Store path:'+store_path);
var tx_id = null;

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
    // assign the store to the fabric client
    fabric_client.setStateStore(state_store);
    var crypto_suite = Fabric_Client.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);

    return fabric_client.createUser(
            {   username: 'admin',
                mspid: 'OrdererMSP',
                cryptoContent: { privateKeyPEM: key, signedCertPEM: cert }
        });
    // get the enrolled user from persistence, this user will sign all requests
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        //console.log('Successfully loaded user1 from persistence');
        member_user = user_from_store;
    } else {
        throw new Error('Failed to get user1.... run registerUser.js');
    }

    return channel.getChannelConfig();
}).then((config_envelope) => {
    //console.log("handling config")


    var original_config_proto = config_envelope.config.toBuffer();

    // lets get the config converted into JSON, so we can edit JSON to
    // make our changes
    return agent.post('http://127.0.0.1:7059/protolator/decode/common.Config',
        original_config_proto)
        .buffer();


}).then((response)=>{

        var original_config_json = response.text.toString();
        console.log(original_config_json);
        // make a copy of the original so we can edit it
        var updated_config_json = JSON.parse(original_config_json);

});
