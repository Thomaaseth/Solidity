const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

describe('Test Voting', function() {
    let owner, voting, voter, proposal

    describe('Contract initialization', function() {

    beforeEach(async function() {
        [owner] = await ethers.getSigners()
        let contract = await ethers.getContractFactory('Voting')
        voting = await contract.deploy()
    })
    
        it('should deploy the contract', async function () {
            let theOwner = await voting.owner()
            assert.equal(owner.address, theOwner)
            // expect(voting.address).to.not.be.undefined;
            // expect(voting.address).to.not.be.null;
            // expect(voting.address).to.be.properAddress;
        });
    })





})


