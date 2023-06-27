const { ethers } = require('hardhat');
const { expect, assert } = require('chai');
const { isCallTrace } = require('hardhat/internal/hardhat-network/stack-traces/message-trace');

describe('Test Voting', function () {
    let owner, signers, voting;


    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        let contract = await ethers.getContractFactory('Voting');
        voting = await contract.deploy();
    })

    describe('Contract initialization', function () {
        it('should deploy the contract', async function () {
            let theOwner = await voting.owner();
            assert.equal(owner.address, theOwner);
        });

        // Add voter tests // 

        describe('Adding voters', function () {
            it('owner should be able to add voters in RegisteringVoters state', async function () {
                let [_, voter1] = await ethers.getSigners();
                await expect(voting.connect(owner).addVoter(voter1.address))
                    .to.emit(voting, 'VoterRegistered')
                    .withArgs(voter1.address);
            });
            it('adding voters fail if state != RegisteringVoters', async function () {
                let [_, voter1] = await ethers.getSigners();
                await voting.connect(owner).startProposalsRegistering();
                await expect(voting.connect(owner).addVoter(voter1.address)).to.be.revertedWith('Voters registration is not open yet');
            });
            it('only owner can add voters', async function () {
                let [_, voter1, voter2] = await ethers.getSigners();
                await expect(voting.connect(voter1).addVoter(voter2.address)).to.be.revertedWith('Ownable: caller is not the owner');
            })
            it('address already registered', async function () {
                let [_, voter1] = await ethers.getSigners();
                await voting.connect(owner).addVoter(voter1.address);
                await expect(voting.connect(owner).addVoter(voter1.address)).to.be.revertedWith('Already registered');
            })
        });

        // Getter getVoter tests //

        describe('get registered voters', function () {

            beforeEach(async function () {
                let signers = await ethers.getSigners();
                owner = signers[0];
                voter1 = signers[1];
                voter2 = signers[2];
                // voter3 = signers[3];
                voter4 = signers[4];
                voter5 = signers[5];
                voter6 = signers[6];
                await voting.connect(owner).addVoter(voter1.address);
                await voting.connect(owner).addVoter(voter2.address);
                await voting.connect(owner).addVoter(voter4.address);
                await voting.connect(owner).addVoter(voter5.address);
                await voting.connect(owner).addVoter(voter6.address);
            });
            it('retrieves info voters', async function () {
                let voterInfo = await voting.connect(voter1).getVoter(voter1.address);
                expect(voterInfo.hasVoted).to.equal(false);
                expect(voterInfo.votedProposalId).to.equal(0);
            })
        });


        // Getter getOneProposal tests //

        describe('get registered proposals', function () {

            beforeEach(async function () {
                let signers = await ethers.getSigners();
                voter1 = signers[1];
                voter2 = signers[2];
                await voting.connect(owner).addVoter(voter1.address);
                await voting.connect(owner).addVoter(voter2.address);
                await voting.connect(owner).startProposalsRegistering();
            });
            it('retrieves the proposal content correctly', async function () {

                await voting.connect(voter1).addProposal('Proposal 1');
                await voting.connect(voter2).addProposal('Proposal 2');
                let proposal = await voting.connect(voter1).getOneProposal(1);
                expect(proposal.description).to.equal('Proposal 1');
                proposal = await voting.connect(voter2).getOneProposal(2);
                expect(proposal.description).to.equal('Proposal 2');
            })
        })


        // Proposal tests // 

        describe('Registering proposal', function () {
            let voter1;

            describe('before starting/after closing proposal registration', function () {

                beforeEach(async function () {
                    let signers = await ethers.getSigners();
                    voter1 = signers[1];
                    await voting.connect(owner).addVoter(voter1.address)
                });
                it('not in registering proposal state', async function () {
                    await expect(voting.connect(voter1).addProposal('Proposal 1')).to.be.revertedWith('Proposals are not allowed yet');
                });
                it('proposal registration closed', async function () {
                    let [_, voter1] = await ethers.getSigners();
                    await voting.connect(owner).startProposalsRegistering();
                    await voting.connect(owner).endProposalsRegistering();
                    await expect(voting.connect(voter1).addProposal('Proposal 2')).to.be.revertedWith('Proposals are not allowed yet');
                })

                describe('after starting proposal registration', function () {

                    beforeEach(async function () {
                        let signers = await ethers.getSigners();
                        voter1 = signers[1];
                        await voting.connect(owner).startProposalsRegistering();
                    });
                    it('check proposal added successfully', async function () {
                        await expect(voting.connect(voter1).addProposal('Proposal 1'))
                            .to.emit(voting, 'ProposalRegistered')
                            .withArgs(1);
                    });
                    it('not a registered voter', async function () {
                        let [_, __, voter2] = await ethers.getSigners();
                        await expect(voting.connect(voter2).addProposal('Proposal 2')).to.be.revertedWith("You're not a voter")
                    });
                    it('verify proposal isnt empty', async function () {
                        await expect(voting.connect(voter1).addProposal('')).to.be.revertedWith('Vous ne pouvez pas ne rien proposer');
                    });
                });
            });
        });

        // Voting tests //

        describe('Vote registering', function () {
            let voter1, voter2, voter3;

            describe('before starting/after closing voting session', function () {

                beforeEach(async function () {
                    let signers = await ethers.getSigners();
                    owner = signers[0];
                    voter1 = signers[1];
                    voter2 = signers[2];
                    voter3 = signers[3];
                    voter4 = signers[4];
                    voter5 = signers[5];
                    voter6 = signers[6];

                    await voting.connect(owner).addVoter(voter1.address);
                    await voting.connect(owner).addVoter(voter2.address);
                    await voting.connect(owner).addVoter(voter4.address);
                    await voting.connect(owner).addVoter(voter5.address);
                    await voting.connect(owner).addVoter(voter6.address);
                });
                it('check voters are registered', async function () {
                    await expect(voting.connect(owner).addVoter(voter1.address)).to.be.revertedWith('Already registered');
                    await expect(voting.connect(owner).addVoter(voter2.address)).to.be.revertedWith('Already registered');
                });
                it('tries to vote but session not started', async function () {
                    let [_, __, voter2] = await ethers.getSigners();
                    await expect(voting.connect(voter1).setVote(1)).to.be.revertedWith('Voting session havent started yet');
                    await expect(voting.connect(voter2).setVote(1)).to.be.revertedWith('Voting session havent started yet');
                });
                it('tries to vote but session ended', async function () {
                    let [_, __, voter2] = await ethers.getSigners();
                    await voting.connect(owner).startProposalsRegistering();
                    await voting.connect(voter1).addProposal('Proposal 1');
                    await voting.connect(owner).endProposalsRegistering();
                    await voting.connect(owner).startVotingSession();
                    await voting.connect(owner).endVotingSession();
                    await expect(voting.connect(voter1).setVote(1)).to.be.revertedWith('Voting session havent started yet');
                    await expect(voting.connect(voter2).setVote(1)).to.be.revertedWith('Voting session havent started yet');
                });

                describe('after starting voting session', function () {

                    beforeEach(async function () {
                        let signers = await ethers.getSigners();
                        voter1 = signers[1];
                        voter2 = signers[2];
                        voter3 = signers[3];
                        voter4 = signers[4];
                        voter5 = signers[5];
                        voter6 = signers[6];
                        await voting.connect(owner).startProposalsRegistering();
                        await voting.connect(voter1).addProposal('Proposal 1');
                        await voting.connect(voter2).addProposal('Proposal 2');
                        await voting.connect(owner).endProposalsRegistering();
                        await voting.connect(owner).startVotingSession();
                    })
                    it('register vote', async function () {
                        await expect(voting.connect(voter1).setVote(0))
                            .to.emit(voting, 'Voted')
                            .withArgs(voter1.address, 0);
                    })
                    it('checks cant vote on inexistant proposal', async function () {
                        await expect(voting.connect(voter1).setVote(4)).to.be.revertedWith('Proposal not found');
                    });
                    it('checks cant vote twice', async function () {
                        await expect(voting.connect(voter1).setVote(0))
                            .to.emit(voting, 'Voted')
                            .withArgs(voter1.address, 0);
                        await expect(voting.connect(voter1).setVote(0)).to.be.revertedWith('You have already voted');
                    });
                    it('tries to vote but not registered as voter', async function () {
                        await expect(voting.connect(voter3).setVote(0)).to.be.revertedWith("You're not a voter");
                    });
                    // We assume Owner isn't allowed to vote by default
                    it('owner tries to vote but not registered as a voter', async function () {
                        await expect(voting.connect(owner).setVote(0)).to.be.revertedWith("You're not a voter");
                    });
                    it('total vote counts increment properly', async function () {
                        let filter = voting.filters.Voted();
                        let initLogs = await voting.queryFilter(filter);
                        let initVoteCount = initLogs.length;
                        await voting.connect(voter1).setVote(0);
                        await voting.connect(voter2).setVote(0);
                        await voting.connect(voter4).setVote(0);
                        await voting.connect(voter5).setVote(0);
                        await voting.connect(voter6).setVote(1);
                        let finalLogs = await voting.queryFilter(filter);
                        let finalVoteCount = finalLogs.length;
                        expect(finalVoteCount).to.equal(initVoteCount + 5);
                    });
                });

                // Check that Owner can register as voter and cast a vote //

                describe('check owner can vote only if he registers as voter', function () {

                    beforeEach(async function () {
                        let signers = await ethers.getSigners();
                        owner = signers[0];
                        await voting.connect(owner).addVoter(owner.address);
                        await voting.connect(owner).startProposalsRegistering();
                        await voting.connect(owner).endProposalsRegistering();
                        await voting.connect(owner).startVotingSession();
                    })
                    it('owner can vote if he registered himself as voter', async function () {
                        await expect(voting.connect(owner).setVote(0))
                            .to.emit(voting, 'Voted')
                            .withArgs(owner.address, 0);
                    })

                })
            });

            // Test tally votes //

            describe('count votes and get winner', function () {

                beforeEach(async function () {

                    await voting.connect(owner).startProposalsRegistering();
                    await voting.connect(owner).endProposalsRegistering();
                    await voting.connect(owner).startVotingSession();
                    await voting.connect(owner).endVotingSession();
                })

                it('tally votes and get winner', async function () {
                    await voting.connect(owner).tallyVotes();

                    let winningProposalId = await voting.winningProposalID();

                    let expectedWinningProposalId = 0;
                    expect(winningProposalId).to.equal(expectedWinningProposalId);
                })
            })

            describe('count votes accurately and get winner', function () {

                beforeEach(async function () {
                    let signers = await ethers.getSigners();
                    owner = signers[0];
                    voter1 = signers[1];
                    voter2 = signers[2];
                    // voter3 = signers[3];
                    voter4 = signers[4];
                    voter5 = signers[5];
                    voter6 = signers[6];
                    await voting.connect(owner).addVoter(voter1.address);
                    await voting.connect(owner).addVoter(voter2.address);
                    await voting.connect(owner).addVoter(voter4.address);
                    await voting.connect(owner).addVoter(voter5.address);
                    await voting.connect(owner).addVoter(voter6.address);
                    await voting.connect(owner).startProposalsRegistering();
                    await voting.connect(voter1).addProposal('Proposal 1');
                    await voting.connect(voter2).addProposal('Proposal 2');
                    await voting.connect(owner).endProposalsRegistering();
                    await voting.connect(owner).startVotingSession();
                    await voting.connect(voter1).setVote(1);
                    await voting.connect(voter2).setVote(1);
                    await voting.connect(voter4).setVote(0);
                    await voting.connect(voter5).setVote(1);
                    await voting.connect(voter6).setVote(1);
                    await voting.connect(owner).endVotingSession();
                })

                it('tally votes and get winner', async function () {
                    await voting.connect(owner).tallyVotes();

                    let winningProposalId = await voting.winningProposalID();

                    let expectedWinningProposalId = 1;
                    expect(winningProposalId).to.equal(expectedWinningProposalId);
                })
            })

            describe('count votes before voting ended', async function () {

                beforeEach(async function () {
                    await voting.connect(owner).startProposalsRegistering();
                    await voting.connect(owner).endProposalsRegistering();
                    await voting.connect(owner).startVotingSession();

                })

                it('tally votes with workflow status not in voting session ended should revert', async function () {
                    await expect(voting.connect(owner).tallyVotes()).to.be.reverted;
                })

            });
        });
    });
});

