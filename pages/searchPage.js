import React, { useState, useEffect, useContext } from "react";

//INTRNAL IMPORT
import Style from "../styles/searchPage.module.css";
import { Slider, Brand } from "../components/componentsindex";
import { SearchBar } from "../SearchPage/searchBarIndex";
import { Filter } from "../components/componentsindex";

import { NFTCardTwo, Banner } from "../collectionPage/collectionIndex";
import images from "../img";

//smart contract import
import { NFTMarketplaceContext } from "../Context/NFTmarketplaceContext";

const searchPage = () => {
  const { fetchNFT } = useContext(NFTMarketplaceContext);
  const [nft, setNft] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);

  useEffect(() => {
    fetchNFT().then((item) => {
      setNft(item.reverse());
      setNftsCopy(item);
      console.log(nft);
    });
  }, []);

  // const collectionArray = [
  //   images.nft_image_1,
  //   images.nft_image_2,
  //   images.nft_image_3,
  //   images.nft_image_1,
  //   images.nft_image_2,
  //   images.nft_image_3,
  //   images.nft_image_1,
  //   images.nft_image_2,
  // ];

  // search function
  const onHandleSearch = (value) => {
    const filteredNft = nft.filter(({ name }) =>
      name.toLowerCase().includes(value.toLowerCase())
    );
    if (filteredNft.length == 0) {
      setNft(nftsCopy);
    }
    else {
      setNft(filteredNft);
    }
  };

  const onClearSearch = () => {
    if (nft.length && nftsCopy.length) {
      setNft(nftsCopy)
    }
  }

  return (
    <div className={Style.searchPage}>
      <Banner bannerImage={images.creatorbackground2} />
      <SearchBar onHandleSearch={onHandleSearch} onClearSearch={onClearSearch} />
      <Filter />
      <NFTCardTwo NFTData={nft} />
      <Slider />
      <Brand />
    </div>
  );
};

export default searchPage;
