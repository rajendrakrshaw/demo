import React, { useState, useEffect, useContext } from "react";
import { Wenb3Modal } from "web3modal";
import { ethers } from "ethers";
import Router from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/io/v0");
// internal import
import { NFTMarketplaceABI, NFTMarketplaceAddress } from "./constants";

// fetch smart contract
const fetchContract = (signerOrProvider) =>
    new ethers.Contract(
        NFTMarketplaceAddress,
        NFTMarketplaceABI,
        signerOrProvider
    );

//connecting with smart contract
const connectingWithSmartContract = async () => {
    try {
        const web3Modal = new Wenb3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);
        return contract;
    } catch (error) {
        console.log("something went wrong");
    }
};

export const NFTMarketplaceContext = React.createContext();

export const NFTMarketplaceprovider = ({ children }) => {
    const titleData = "Discover collect and sell NFT's";

    //usestate
    const [currentAccount, SetcurrentAccount] = useState("");

    //check if wallet is connected
    const checkIfWallelConnected = async () => {
        try {
            if (!window.ethereum) {
                return console.log("install metamask");
            }
            const accounts = await window.ethereum.request({
                method: "eth_accounts",
            });
            if (accounts.length) {
                SetcurrentAccount(accounts[0]);
            } else {
                console.log("no account found");
            }
            console.log(currentAccount)
        } catch (error) {
            console.log("wallet not connected");
        }
    };

    useEffect(() => {
        checkIfWallelConnected();
    }, []);

    //connect wallet function
    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                return console.log("install metamask");
            }
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            SetcurrentAccount(accounts[0]);
            window.location.reload();
        } catch (error) {
            console.log("error while connecting wallet");
        }
    };

    //upload image to ipfs
    const uploadToIPFS = async (file) => {
        try {
            const added = await client.add({ content: file });
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            return url;
        } catch (error) {
            console.log("error uploading to ipfs");
        }
    };

    // create nft
    const createNFT = async (formInput, fileUrl, Router) => {
        const { name, description, price } = formInput;
        if (!name || !description || !price || !fileUrl)
            return console.log("data missing");
        const data = JSON.stringify({ name, description, image: fileUrl });
        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            await createSale(url, price);
        } catch (error) {
            console.log("error while creating nft");
        }
    };

    // createSale function
    const createSale = async (url, formInputPrice, isReselling, id) => {
        try {
            const price = ethers.utils.parseUnits(formInputPrice, "ether");
            const contract = await connectingWithSmartContract();
            const listingPrice = await contract.getListingPrice();
            const transaction = !isReselling
                ? await contract.createToken(url, price, {
                    value: listingPrice.toString(),
                })
                : await contract.reSellToken(url, price, {
                    value: listingPrice.toString(),
                });
            await transaction.wait();
        } catch (error) {
            console.log("error while creating sell");
        }
    };

    // fetch nft function
    const fetchNFT = async () => {
        try {
            const provider = new ethers.providers.JsonRpcProvider();
            const contract = fetchContract(provider);
            const data = await contract.fetchMarketItem();
            const items = await Promise.all(
                data.map(
                    async ({ tokenId, seller, owner, price: unformattedprice }) => {
                        const tokenURI = await contract.tokenURI(tokenId);
                        const {
                            data: { image, name, description },
                        } = await axios.get(tokenURI);
                        const price = ethers.utils.formatUnits(
                            unformattedprice.toString(),
                            "ether"
                        );
                        return {
                            price,
                            tokenId: tokenId.toNumber(),
                            seller,
                            owner,
                            image,
                            name,
                            description,
                            tokenURI,
                        }
                    }
                )
            );
            return items;
        } catch (error) {
            console.log("error while fetching nft");
        }
    };

    //fetch mynft
    const fetchMyNFT = async (type) => {
        try {
            const contract = await connectingWithSmartContract();
            const data =
                type == "fetchItemListed"
                    ? await contract.fetchItemsListed()
                    : await contract.fetchMyNFT();
            const items = await Promise.all(
                data.map(async ({ tokenId, seller, owner, price: unformattedprice }) => {
                    const tokenURI = await contract.tokenURI(tokenId);
                    const {
                        data: { image, name, description },
                    } = await axios.get(tokenURI)
                    const price = ethers.utils.formatUnits(
                        unformattedprice.toString(),
                        "ether"
                    );
                    return {
                        price,
                        tokenId: tokenId.toNumber(),
                        seller,
                        owner,
                        image,
                        name,
                        description,
                        tokenURI,
                    };
                }
                )
            );
            return items;
        } catch (error) {
            console.log("error while fetching my nft");
        }
    };

    // buy nft 
    const buyNFT = async (nft) => {
        try {
            const contract = await connectingWithSmartContract();
            const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

            const transaction = await contract.createMarketSale(nft.tokenId, {
                value: price,
            });
            await transaction.wait();
        } catch (error) {
            console.log("error while buying nft")
        }
    }



    return (
        <NFTMarketplaceContext.Provider
            value={{ checkIfWallelConnected, connectWallet, uploadToIPFS, createNFT, fetchNFT, fetchMyNFT, buyNFT, currentAccount, titleData }}
        >
            {children}
        </NFTMarketplaceContext.Provider>
    );
};
