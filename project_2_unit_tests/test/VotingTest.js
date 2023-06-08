const { ethers } = require('hardhat');
const { expect, assert } = require('chai');
const { isCallTrace } = require('hardhat/internal/hardhat-network/stack-traces/message-trace');

describe('Test Voting', function() {
    let owner, voting, voter, proposal


    beforeEach(async function() {
        [owner] = await ethers.getSigners();
        let contract = await ethers.getContractFactory('Voting');
        voting = await contract.deploy();
    })

    describe('Contract initialization', function() {
        it('should deploy the contract', async function () {
            let theOwner = await voting.owner();
            assert.equal(owner.address, theOwner);
        });

    // Add voter tests //

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

    // Proposal tests //

    describe('Registering proposal', function() {
        let voter1;
        describe('before/after starting proposal registration', function(){
        
            beforeEach(async function() {
                let signers = await ethers.getSigners();
                voter1 = signers[1];
                await voting.connect(owner).addVoter(voter1.address)
            });
            it('not in registering proposal state', async function() {
            await expect(voting.connect(voter1).addProposal('Proposal 1')).to.be.revertedWith('Proposals are not allowed yet');
            });
            it('proposal registration closed', async function() {
                let [_, voter1] = await ethers.getSigners();
                await voting.connect(owner).startProposalsRegistering();
                await voting.connect(owner).endProposalsRegistering();
                await expect(voting.connect(voter1).addProposal('Proposal 2')).to.be.revertedWith('Proposals are not allowed yet');
            })
                
        describe('after starting proposal registration', function(){
            
            beforeEach(async function() {
                let signers = await ethers.getSigners();
                voter1 = signers[1];
                await voting.connect(owner).startProposalsRegistering();
            });
            it('check proposal added successfully', async function() {
                await expect(voting.connect(voter1).addProposal('Proposal 1'))
                .to.emit(voting, 'ProposalRegistered')
                .withArgs(1);
            });
            it('not a registered voter', async function() {
                let [_, __, voter2] = await ethers.getSigners();
                await expect(voting.connect(voter2).addProposal('Proposal 2')).to.be.revertedWith("You're not a voter")
            });
            it('verify proposal isnt empty', async function() {
                await expect(voting.connect(voter1).addProposal('')).to.be.revertedWith('Vous ne pouvez pas ne rien proposer');
            });
            });
        });
    });

    // Voting tests //

    // describe('')

})
})
