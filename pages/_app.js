import "../styles/globals.css";

//INTRNAL IMPORT
import { NavBar, Footer } from "../components/componentsindex";
import { NFTMarketplaceprovider } from "../Context/NFTmarketplaceContext";
const MyApp = ({ Component, pageProps }) => (
  <div>
    <NFTMarketplaceprovider>
      <NavBar />
      <Component {...pageProps} />
      <Footer />
    </NFTMarketplaceprovider>
  </div>
);

export default MyApp;
