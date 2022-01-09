const { expect } = require("chai");

describe("Web3PandaTLDFactory (onlyOwner)", function () {
  let contract;
  let owner;
  let nonOwner;

  const tldPrice = ethers.utils.parseUnits("1", "ether");

  beforeEach(async function () {
    [owner, nonOwner] = await ethers.getSigners();

    const Web3PandaTLDFactory = await ethers.getContractFactory("Web3PandaTLDFactory");
    contract = await Web3PandaTLDFactory.deploy(tldPrice);
  });

  it("should create a new valid TLD through ownerCreateTld()", async function () {
    await expect(contract.ownerCreateTld(
      ".web3", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.emit(contract, "TldCreated");
  });

  it("should fail to create a new valid TLD if user is not owner", async function () {
    await expect(contract.connect(nonOwner).ownerCreateTld(
      ".web3", // TLD
      "WEB3", // symbol
      nonOwner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("should fail to create a new valid TLD if more than 1 dot in the name", async function () {
    await expect(contract.ownerCreateTld(
      ".web.3", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('There should be exactly one dot in the name');
  });

  it("should fail to create a new valid TLD if no dot in the name", async function () {
    await expect(contract.ownerCreateTld(
      "web3", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('There should be exactly one dot in the name');
  });

  it("should fail to create a new valid TLD if name does not start with dot", async function () {
    await expect(contract.ownerCreateTld(
      "web.3", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('The dot must be at the start of the TLD name');
  });

  it("should fail to create a new valid TLD if name is of length 1", async function () {
    await expect(contract.ownerCreateTld(
      ".", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('The TLD name must be longer than 1 character');
  });

  it("should fail to create a new valid TLD with empty name", async function () {
    await expect(contract.ownerCreateTld(
      "", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('The TLD name must be longer than 1 character');
  });

  it("should fail to create a new valid TLD if TLD with this name already exists", async function () {
    // create a valid TLD
    await expect(contract.ownerCreateTld(
      ".web3", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.emit(contract, "TldCreated");

    // try to create a TLD with the same name
    await expect(contract.ownerCreateTld(
      ".web3", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('TLD with this name already exists');
  });

  it("should fail to create a new valid TLD if TLD name is too long", async function () {
    // try to create a TLD with the same name
    await expect(contract.ownerCreateTld(
      ".web3dfferopfmeomeriovneriovneriovndferfgergf", // TLD
      "WEB3", // symbol
      owner.address, // TLD owner
      ethers.utils.parseUnits("0.2", "ether"), // domain price
      false // buying enabled
    )).to.be.revertedWith('The TLD name is too long');

  });

  it("should change the TLD price", async function () {
    const priceBefore = await contract.price();
    expect(priceBefore).to.equal(tldPrice);

    const newPrice = ethers.utils.parseUnits("2", "ether");

    await contract.changePrice(newPrice);

    const priceAfter = await contract.price();
    expect(priceAfter).to.equal(newPrice);

    // fail if sender is not owner
    await expect(contract.connect(nonOwner).changePrice(
      ethers.utils.parseUnits("2", "ether")
    )).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("should add a new forbidden domain", async function () {
    const tld = ".co";

    const forbiddenTldBefore = await contract.forbidden(tld);
    expect(forbiddenTldBefore).to.be.false;

    await contract.addForbiddenTld(tld);

    const forbiddenTldAfter = await contract.forbidden(tld);
    expect(forbiddenTldAfter).to.be.true;

    // fail if sender is not owner
    await expect(contract.connect(nonOwner).addForbiddenTld(".io")).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("should remove a forbidden domain", async function () {
    const tld = ".eth";

    const forbiddenTldBefore = await contract.forbidden(tld);
    expect(forbiddenTldBefore).to.be.true;

    await contract.removeForbiddenTld(tld);

    const forbiddenTldAfter = await contract.forbidden(tld);
    expect(forbiddenTldAfter).to.be.false;

    // fail if sender is not owner
    await expect(contract.connect(nonOwner).removeForbiddenTld(".net")).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("should change max length for a TLD name", async function () {
    const nameMaxLengthBefore = await contract.nameMaxLength();
    expect(nameMaxLengthBefore).to.equal(40);

    await contract.changeNameMaxLength(52);

    const nameMaxLengthAfter = await contract.nameMaxLength();
    expect(nameMaxLengthAfter).to.equal(52);

    // fail if sender is not owner
    await expect(contract.connect(nonOwner).changeNameMaxLength(60)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("should change the royalty amount", async function () {
    const royaltyBefore = await contract.royalty();
    expect(royaltyBefore).to.equal(0);

    const newRoyalty = 10;
    
    await contract.changeRoyalty(newRoyalty);

    const royaltyAfter = await contract.royalty();
    expect(royaltyAfter).to.equal(10);

    // if user is not owner, the tx should revert
    await expect(contract.connect(nonOwner).changeRoyalty(20)).to.be.revertedWith('Ownable: caller is not the owner');
  });

});
