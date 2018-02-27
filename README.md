
## What this example do
This example tries to update the fabcar example  system channel with two orgs 

 Fabcar example is currently having only one  Org . Org1MSP in its system channel *[]: 

 For testing purpose to generate the second OrgMSP  ,ie Org2MSP , we are pulling the org details from  balance transfer application
 
 Then using the Org2MSP from Balance transfer as a new org to be added with Fabcar.
 


## Steps to update config of channel testchain id

First clone this repository

This repository uses hyperledger x86_64-1.1.0-preview version


Then run balance transfer app  using ./runApp.sh from fabric-samples/balance-transfe

now if you do a docker ps you can see all the containers running (Orderer, peer etc)

### Prerequisites 
Run configtxlator  .Please check for the version

### ./configtxlator version
 configtxlator:
 Version: 1.1.0-preview
 Go version: go1.9
 OS/Arch: darwin/amd64
 
 ### ./configtxlator start
2018-02-27 17:23:56.389 IST [configtxlator] startServer -> INFO 001 Serving HTTP requests on 0.0.0.0:7059
 
### step 1
 
 Run balance transfer application which is having two organizations 
 Then pull the testchainid channel  (System configuration )
 Store the configuration into a json 
 Now we have the configuration of two organizations 
 
 
 Make sure you have done npm install and running confitxlator
 
 
 then run fabric-samples/balance-transfer]node pullconfig.js 
 
  pullconfig.js will pull the configuration from systemchannel named testchain id for balance transfer application
  
  let us store this json output 
  
  Please see the file out.json  in the balance-transfer directory, which contains the pulled json
  
  The file out.json is having  as structure similiar to one given below 

  We are interseted in extracting Org2MSP , so that we are sure that the syntax of new org details are correct .
  
  channel_group": {
  		"groups": {
  			"Consortiums": {
  				"groups": {
  					"SampleConsortium": {
  						"groups": {
  							"Org1MSP": { },
  							"Org2MSP": { },

  
 
 
 
 

## Hyperledger Fabric Samples

Please visit the [installation instructions](http://hyperledger-fabric.readthedocs.io/en/latest/samples.html).

## License <a name="license"></a>

Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the [LICENSE](LICENSE) file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
