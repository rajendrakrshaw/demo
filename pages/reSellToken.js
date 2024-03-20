import React, { useState, useEffect, useContext } from "react";
import Style from "../styles/reSellToken.module.css";
import { useRouter } from "next/router";
import axios from "axios";
import formStyle from "../AccountPage/Form/Form.module.css";
import { Button } from "../components/componentsindex";
import Image from "next/image";

//smart contract import
import { NFTMarketplaceContext } from "../Context/NFTmarketplaceContext";

const reSellToken = () => {
    const { createSale } = useContext(NFTMarketplaceContext);
    const [price, setPrice] = useState("");
    const [image, setImage] = useState("");
    const router = useRouter();
    const { id, tokenURI } = router.query;

    const fetchNFT = async () => {
        if (!tokenURI) return;
        const { data } = await axios.get(tokenURI);

        // setPrice(data.price);
        setImage(data.image);
    };
    useEffect(() => {
        fetchNFT();
    }, [id]);

    const resell = async () => {
        try {
            await createSale(tokenURI, price, true, id);
            router.push("/author");
        } catch (error) {
            console.log(error);
        }

    };
    return (
        <div className={Style.reSellToken}>
            <div className={Style.reSellToken_box}>
                <div className={formStyle.Form_box_input}>
                    <h1>ReSell Your Token Set Price</h1>
                    <label htmlFor="name">Price</label>
                    <input
                        type="number"
                        min={0.000000000001}
                        className={formStyle.Form_box_input_userName}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>
                <div className={Style.reSellToken_box_img}>
                    {image && (<Image src={image} alt="resell nft" width={400} height={400} />)}
                </div>
                <div className={Style.reSellToken_box_btn}>
                    <Button btnName="Resell NFT" handleClick={() => resell()} />
                </div>
            </div>
        </div>
    );
};

export default reSellToken;
