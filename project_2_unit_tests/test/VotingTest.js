const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

describe('Test Voting', function() {
    let owner, voting, voter, proposal

    describe('Contract initialization', function() {

    beforeEach(async function() {
        [owner] = await ethers.getSigners();
        let contract = await ethers.getContractFactory('Voting');
        voting = await contract.deploy();
    })
    
        it('should deploy the contract', async function () {
            let theOwner = await voting.owner();
            assert.equal(owner.address, theOwner);
        });

    describe('Adding voters', function() {
        it('owner should be able to add voters in RegisteringVoters state', async function(){
            let [_, voter1] = await ethers.getSigners();
            await expect(voting.connect(owner).addVoter(voter1.address))
            .to.emit(voting, 'VoterRegistered')
            .withArgs(voter1.address);
        });
        it('adding voters fail if state != RegisteringVoters', async function() {
            let [_, voter1] = await ethers.getSigners();
            await voting.connect(owner).startProposalsRegistering();
            await expect(voting.connect(owner).addVoter(voter1.address)).to.be.revertedWith('Voters registration is not open yet');
        });
        it('only owner can add voters', async function() {
            let[_, voter1, voter2] = await ethers.getSigners();
            await expect(voting.connect(voter1).addVoter(voter2.address)).to.be.revertedWith('Ownable: caller is not the owner');
        })
        it('address already registered', async function() {
            let[_, voter1] = await ethers.getSigners();
            await voting.connect(owner).addVoter(voter1.address);
            await expect(voting.connect(owner).addVoter(voter1.address)).to.be.revertedWith('Already registered');
        })  
    });
    });
})


