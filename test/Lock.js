const { expect } = require("chai");

describe("NFTMarketplace", function () {
  let NFTMarketplace;
  let nftMarketplace;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    nftMarketplace = await NFTMarketplace.deploy();
    await nftMarketplace.deployed();
  });

  it("Should return the correct listing price", async function () {
    // Expected listing price in ether (adjust this according to your contract)
    const expectedListingPrice = ethers.utils.parseEther("0.0015");

    // Call the getListingPrice function
    const actualListingPrice = await nftMarketplace.getListingPrice();

    // Convert actual listing price to ether
    const actualListingPriceEther = ethers.utils.formatEther(actualListingPrice);

    // Assert that the actual listing price matches the expected listing price
    expect(actualListingPriceEther).to.equal(ethers.utils.formatEther(expectedListingPrice));
  });
});
