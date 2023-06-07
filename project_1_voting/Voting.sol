// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Ownable.sol";


contract Voting is Ownable {
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionsStarted,
        VotingSessionEnded,
        VotesTallied
    }

    mapping(address => Voter) public voters;

    Proposal[] public proposals;

    WorkflowStatus public currentStatus;

    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    function whitelistVote(address voter) public onlyOwner {
        // require(!voters[Voter].hasVoted, "The address already voted.");
        require(!voters[voter].isRegistered, "The address is already registered");
        voters[voter].isRegistered=true;
        emit VoterRegistered(voter);
        }

    modifier onlyDuringRegistration() {
        require(currentStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration is not active.");
        _;
    }

    modifier onlyDuringVoteOpen() {
        require(currentStatus == WorkflowStatus.VotingSessionsStarted, "Voting need to open first!");
        _;
    }

    modifier onlyAfterVoteEnded() {
        require(currentStatus == WorkflowStatus.VotingSessionEnded, "Voting still open.");
        _;
    }

    function startProposalRegistration() public onlyOwner {
        currentStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, currentStatus);
    }

    function endProposalRegistration() public onlyOwner {
        require(currentStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration is not active.");
        currentStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, currentStatus);
    }

    function newProposal(string memory description) public onlyDuringRegistration {
        require(bytes(description).length > 0, "Proposal description cannot be empty.");
        Proposal memory newProposal = Proposal({description: description, voteCount: 0});
        proposals.push(newProposal);
        uint proposalId = proposals.length;
        emit ProposalRegistered(proposalId);
    }

    function startVote() public onlyOwner {
        require(currentStatus == WorkflowStatus.ProposalsRegistrationEnded,"You need to end proposals registration");
        currentStatus = WorkflowStatus.VotingSessionsStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, currentStatus);
    }

    function endVote() public onlyOwner {
        require(currentStatus == WorkflowStatus.VotingSessionsStarted, "Voting has not been registered yet");
        currentStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionsStarted, currentStatus);
    }

    function vote(uint proposalId) public onlyDuringVoteOpen {
    Voter storage voter = voters[msg.sender];
    require(voter.isRegistered, "Has no right to vote");
    require(!voter.hasVoted, "Already voted.");
    voter.hasVoted = true;
    voter.votedProposalId = proposalId;
    emit Voted(msg.sender, proposalId);
    proposals[proposalId].voteCount += 1;
    }

    function getListProposals() public view returns (Proposal[] memory) {
    return proposals;
    }

    function getSpecificProposal(uint proposalId) public view returns(string memory, uint) {
        require(proposalId < proposals.length, 'Proposal does not exist');
        Proposal memory proposal = proposals[proposalId];
        return(proposal.description, proposal.voteCount);
    }


    function getWinningProposal() public returns (string memory, uint) {
        require(currentStatus == WorkflowStatus.VotingSessionEnded, "Voting has not been registered yet.");
        currentStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, currentStatus);
        require(proposals.length > 0, "No proposals registered.");

        uint winningVoteCount = 0;
        uint winningProposalId;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winningProposalId = i;
        }
    }
    require(winningVoteCount > 0, "No votes registered.");
    Proposal memory winningProposal = proposals[winningProposalId];
    return (winningProposal.description, winningProposal.voteCount);
    }
}













