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
var requester = require('request');

var fabric_client = new Fabric_Client();

var original_config_proto =  null;
var channel_name = 'testchainid';
var channel = fabric_client.newChannel(channel_name);
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);
var orderer = fabric_client.newOrderer('grpc://localhost:7050')
channel.addOrderer(orderer);

let key = fs.readFileSync("../basic-network/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore/1deeab5433fa6e5f045eb763109d6165268fba153211af1281f00d45f54b1022_sk");
let cert = fs.readFileSync("../basic-network/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts/Admin@example.com-cert.pem");

//var inputdata = fs.readFileSync("/home/shibu/HL/test/orig.json");
let channelConfig = fs.readFileSync("../balance-transfer/out.json");

 channelConfig = JSON.parse(channelConfig);
console.log("=============================================")
console.log("Printing testchainid config ",channelConfig)
console.log("=============================================")

console.log("Getting Org2MSP details")
let org2 = channelConfig.channel_group.groups.Consortiums.groups.SampleConsortium.groups["Org2MSP"]
console.log("============Begining  of ORG 2 Configuration =================================")
//console.log(JSON.stringify(org2))
console.dir(org2, {depth: null, colors: true})

console.log("============End of ORG 2 Configuration =================================")



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


    original_config_proto = config_envelope.config.toBuffer();

    // lets get the config converted into JSON, so we can edit JSON to
    // make our changes
    return agent.post('http://127.0.0.1:7059/protolator/decode/common.Config',
        original_config_proto)
        .buffer();


}).then((response)=>{

        var original_config_json = response.text.toString();

        // make a copy of the original so we can edit it
        var updated_config_json = JSON.parse(original_config_json);

var str1 = JSON.stringify(updated_config_json);

fs.writeFile("premodified.json",str1, (err) => {
    if (err) {
        console.error(err);
        return;
    };
console.log("File has been created");
});

	console.log("The original configuration from fabcar")
	console.log("============Begining  of Original fab car  Configuration =================================")

	console.dir(updated_config_json, {depth: null, colors: true})
	console.log("============End of   of Original fab car  Configuration =================================")

	console.log("============We are appending the Org2MSP configuration to fabcar =================================")
	console.log("============Begining of   of updated configuration fab car  Configuration =================================")

	updated_config_json.channel_group.groups.Consortiums.groups.SampleConsortium.groups["Org2MSP"]=org2
	updated_config_json.channel_group.groups.Consortiums.groups.SampleConsortium.version = "" + (parseInt(updated_config_json.channel_group.groups.Consortiums.groups.SampleConsortium.version) +1);

	console.log(JSON.stringify(updated_config_json))


	console.log("============End of   of updated configuration fab car  Configuration =================================")



 //updated_config_json.channel_group.groups.Consortiums.groups.SampleConsortium.groups["Org2MSP"] =org2

 return agent.post('http://127.0.0.1:7059/protolator/encode/common.Config', updated_config_json).buffer();
}).then((response) =>{
		console.log("Trying to sending the update encode");
        	console.log(response.body);
		var updated_config_proto = response.body;

		var formData = {
			channel: channel_name,
			original: {
				value: original_config_proto,
				options: {
					filename: 'original.proto',
					contentType: 'application/octet-stream'
				}
			},
			updated: {
				value: updated_config_proto,
				options: {
					filename: 'updated.proto',
					contentType: 'application/octet-stream'
				}
			}
		};

		return new Promise((resolve, reject) =>{
			requester.post({
				url: 'http://127.0.0.1:7059/configtxlator/compute/update-from-configs',
				formData: formData
			}, function optionalCallback(err, res, body) {
				if (err) {
					console.log('Failed to get the updated configuration ::'+err);
					reject(err);
				} else {
					var proto = new Buffer(body, 'binary');
					resolve(proto);
				}
			});
		});
}).then((response) =>{
	var config_proto = response;

	// build up the create request
	let tx_id = fabric_client.newTransactionID();
	console.log("Trying to sending the update");
	var signatures = [];

	var signature = fabric_client.signChannelConfig(config_proto);
	signatures.push(signature);


	// Get te Signatures
	let request = {
		config: config_proto,
		signatures: signatures, 
		name: channel_name,
		orderer: orderer,
		txId: tx_id
	};

	// this will send the update request to the orderer
	return fabric_client.updateChannel(request);
}).then((result) => {
	if(result.status && result.status === 'SUCCESS') {
		console.log('Successfully updated the channel.');
	} else {
		console.log('Failed to update the channel. ');
	}
}).catch((err) =>{
	console.log('Unexpected error :' + err);
});
