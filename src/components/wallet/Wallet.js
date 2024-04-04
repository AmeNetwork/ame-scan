import { useState, useEffect } from "react";
import "./Wallet.css";
function Wallet(props) {
  const [currentAddress, setCurrentAddress] = useState([]);
  useEffect(() => {
    (async function fetchData() {
        if (window.ethereum) {
            await initAccount();
            window.ethereum.on("accountsChanged", async function () {
                window.location.reload();
            });

       
             window.ethereum.on("chainChanged", async function () {
               window.location.reload(); 
             });
        }
    })();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setCurrentAddress(accounts[0]);
        props.updateWallet(currentAddress);
      } catch (error) {}
    }
  };

  const initAccount = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    var currentAddress = accounts[0] != undefined ? accounts[0] : "";
    setCurrentAddress(currentAddress);
    props.updateWallet(currentAddress);
  };







  return (
    <div className="WalletComponent">

      {currentAddress == "" ? (
        <div className="ConnectWallet" onClick={connectWallet}>
          Connect Wallet
        </div>
      ) : (
        <div>{currentAddress}</div>
   
      )}
    </div>
  );
}
export default Wallet;
