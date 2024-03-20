import React, { useState, useEffect, useContext } from "react";
import Web3Modal from 'web3modal';
import { ethers } from "ethers";
import Router from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";
import WalletConnectProvider from '@walletconnect/web3-provider'
import { useRouter } from 'next/router';


// internal import
import { NFTMarketplaceABI, NFTMarketplaceAddress } from "./constants";

// fetch smart contract
const fetchContract = (signerOrProvider) => {
    if (!NFTMarketplaceAddress || !NFTMarketplaceABI || !signerOrProvider) {
        console.log('Missing required arguments');
    }
    const contract = new ethers.Contract(
        NFTMarketplaceAddress,
        NFTMarketplaceABI,
        signerOrProvider
    );
    return contract;
}


//connecting with smart contract
const connectingWithSmartContract = async () => {
    try {
        // Initialize Web3Modal
        const web3Modal = new Web3Modal({
            network: "sepolia", // change to sepolia for Sepolia test network
            cacheProvider: true,
            providerOptions: {
                walletconnect: {
                    package: WalletConnectProvider,
                    options: {
                        rpc: {
                            8200: "https://rpc.sepolia.org/", // Sepolia test network RPC URL
                        },
                    },
                },
            },
        });

        // Connect to a wallet
        const provider = await web3Modal.connect();

        // Create a Web3Provider using the connected provider
        const web3Provider = new ethers.providers.Web3Provider(provider);

        // Get the signer from the provider
        const signer = web3Provider.getSigner();

        // Fetch the contract using the signer
        const contract = fetchContract(signer);

        return contract;
    } catch (error) {
        console.log("something went wrong", error);
        return null;
    }
};


export const NFTMarketplaceContext = React.createContext();

export const NFTMarketplaceprovider = ({ children }) => {
    const titleData = "Discover collect and sell NFT's";

    //usestate
    const [currentAccount, SetcurrentAccount] = useState("");
    const router = useRouter();

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
            // window.location.reload();
        } catch (error) {
            console.log("error while connecting wallet");
        }
    };

    //upload image to ipfs
    const uploadToIPFS = async (file) => {
        if (!file) {
            throw new Error("No file provided.");
        }
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios({
                method: "POST",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                    pinata_api_key: "728241098003c6c7b08b",
                    pinata_secret_api_key: "ed8c0b09fc335aadd2abe306a7ce4c2d19c1e2291df9ef0b59f6b78d155a6d96",
                },
            });
            const ImgHash = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
            return ImgHash;
        } catch (error) {
            console.error("Error uploading file to Pinata:", error);
            throw new Error("Failed to upload file to IPFS.");
        }
    };

    // create nft
    const createNFT = async (name, price, image, description, router) => {
        if (!name || !description || !price || !image)
            return console.log("data missing");
        const data = JSON.stringify({ name, description, image });
        try {
            const response = await axios({
                method: "POST",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: data,
                headers: {
                    "Content-Type": "application/json",
                    pinata_api_key: "728241098003c6c7b08b",
                    pinata_secret_api_key: "ed8c0b09fc335aadd2abe306a7ce4c2d19c1e2291df9ef0b59f6b78d155a6d96",
                },
            });
            const url = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
            console.log(url);
            await createSale(url, price);
            router.push("/searchPage");
        } catch (error) {
            console.log("error while creating nft", error);
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
                : await contract.resellToken(id, price, {
                    value: listingPrice.toString(),
                });
            await transaction.wait();
            // console.log(transaction);

        } catch (error) {
            console.log("error while creating sell", error);
        }
    };

    // fetch nft function
    const fetchNFT = async () => {
        try {
            const provider = new ethers.providers.JsonRpcProvider();
            const contract = fetchContract(provider);
            const data = await contract.fetchMarketItems();
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

    useEffect(() => {
        fetchNFT();
    }, [])

    //fetch my nft
    const fetchMyNFT = async (type) => {
        try {
            const contract = await connectingWithSmartContract();
            const data =
                type == "fetchItemListed"
                    ? await contract.fetchItemsListed()
                    : await contract.fetchMyNFTs();
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
            router.push("/author");
        } catch (error) {
            console.log("error while buying nft")
        }
    }



    return (
        <NFTMarketplaceContext.Provider
            value={{ checkIfWallelConnected, connectWallet, uploadToIPFS, createNFT, fetchNFT, fetchMyNFT, buyNFT, createSale, currentAccount, titleData }}
        >
            {children}
        </NFTMarketplaceContext.Provider>
    );
};