**Voting Smart Contract - Test Suite**

This project is a voting smart contract implemented on the Ethereum Blockchain using Solidity. The contract allows a contract owner to register voters, voters to register proposals during the proposal registration session, and then vote for their chosen proposals during the voting session. Finally, it counts the votes and declares a winning proposal.

**The test suite runs the following functionalities:**

- Contract Initialization test checks if the contract is deployed correctly and the owner is correctly set.
- Adding Voters tests that the owner can add voters correctly, no one else can add voters, duplicate voters cannot be added, and voters can't be added outside of the registration period.
- Getting Registered Voters tests the function to fetch voter details.
- Getting Registered Proposals verifies the proposal retrieval function.
- Registering Proposals checks that only registered voters can submit proposals and only during the proposal registration period. It also checks that the proposal isn't empty.
- Vote Registering verifies that votes are registered correctly, checks that one cannot vote more than once, only registered voters can vote, and votes can't be cast outside of the voting period. It also checks that the owner can vote if registered as a voter.
- Count Votes and Get Winner validates the function to tally votes and determine the winning proposal.

**Getting Started**

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

**Prerequisites**

Before running this project locally, you need to install:

- Node.js
- npm
- Hardhat

**Installing**

Clone the repository:

```git clone https://github.com/Thomaaseth/Solidity-Alyra-projects.git```

**Install the project dependencies in the project folder:**

npm install

**Running the tests:**

Compile the smart contracts:

```npx hardhat compile```

Run the tests:

```npx hardhat test```

Built With

- Solidity 
- Hardhat 
- JavaScript

**License**
This project is licensed under the MIT License - see the LICENSE.md file for details.
