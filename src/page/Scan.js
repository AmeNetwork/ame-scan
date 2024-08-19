import React, { useState, useEffect, memo } from "react";
import "./Scan.css";
import Chains from "../config/Chains";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Tutorial from "../components/Tutorial/Tutorial";
import chevronDown from "../assets/chevron-down.svg";
import Wallet from "../components/wallet/Wallet";
import { Select, ConfigProvider, Modal } from "antd";
import ScanIcon from "../assets/scanIcon.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import AmeLib from "ame-sdk";
function Scan() {
  const [options, setOptions] = useState([]);
  const [ame, setAme] = useState();
  const [searchAddress, setSearchAddress] = useState("");
  const [components, setComponents] = useState([]);
  const [inputsData, setInputsData] = useState([]);
  const [valuesData, setValuesData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [currentAddress, setCurrentAddress] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [buttonType, setButtonType] = useState(0); //0:none,1:add,2:delete
  const [networkValue, setNetworkValue] = useState("Select a network");
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    var options = [];
    var optionsArray = Array.from(Chains);
    for (var index in optionsArray) {
      options.push({
        value: optionsArray[index][1].Network.chainId,
        label: optionsArray[index][1].Network.chainName,
        chainId: optionsArray[index][1].Network.chainId,
      });
    }
    setOptions(options);
  }, []);

  useEffect(() => {
    (async function fetchData() {
      await initNetwork();
    })();
  }, [currentAddress]);

  var changeNetwork = async (value) => {
    var params = Chains.get(value).Network;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: value }],
      });

      window.location.reload();
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [params],
          });

          window.location.reload();
        } catch (addError) {
          console.log(addError);
        }
      }
    }
  };

  var initNetwork = async () => {
    var chainId = await window.ethereum.request({ method: "eth_chainId" });
    var currentChainId = Chains.has(chainId) ? chainId : "";
    if (currentChainId != "") {
      setNetworkValue(currentChainId);
      var ame = new AmeLib(
        window.ethereum,
        Chains.get(currentChainId).ameWorld
      );
      setAme(ame);
      if (currentAddress != "") {
        var registerResult = await ame.isRegistered(currentAddress);
        setIsRegistered(registerResult);
      }
    } else {
    }
  };

  const sortInputs = (componentsData) => {
    var inputs = [];
    for (var i = 0; i < componentsData.length; i++) {
      var methodsInput = [];
      var methods = componentsData[i].methods;
      for (var y = 0; y < methods.length; y++) {
        methodsInput.push([
          new Array(methods[y].dataType[0].length).fill(""),
          new Array(methods[y].dataType[1].length).fill(""),
          false,
        ]);
      }
      inputs.push(methodsInput);
    }
    setInputsData(inputs);
  };

  const sortValuesAndTransactions = (componentsData) => {
    var values = [];
    var transactions = [];
    for (var i = 0; i < componentsData.length; i++) {
      values.push(new Array(componentsData[i].methods.length).fill(""));
      transactions.push(new Array(componentsData[i].methods.length).fill(""));
    }
    setValuesData(values);
    setTransactionsData(transactions);
  };

  const queryContract = async () => {
    try {
      var code = await ame.web3.eth.getCode(searchAddress);

      if (code == "0x") {
        var componentsData = await ame.queryAccount(searchAddress);
        setComponents(componentsData);
        sortInputs(componentsData);
        sortValuesAndTransactions(componentsData);
        console.log("componentsData", componentsData);
        if (currentAddress != "") {
          if (searchAddress == currentAddress) {
            setButtonType(2);
          } else {
            setButtonType(0);
          }
        } else {
          setButtonType(0);
        }
      } else {
        var componentsData = await ame.queryComponent(searchAddress);
        console.log("componentsData", componentsData);
        setComponents([componentsData]);
        sortInputs([componentsData]);
        sortValuesAndTransactions([componentsData]);
        //Does the user has components?
        if (currentAddress != "") {
          var hasComponent = await ame.hasComponent(
            currentAddress,
            searchAddress
          );
          if (hasComponent) {
            setButtonType(2);
          } else {
            setButtonType(1);
          }
        } else {
          setButtonType(0);
        }
      }
    } catch (error) {
      console.log("address error");

      toast.error("The component or wallet address is incorrect!", {
        position: "top-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      setComponents([]);
    }
  };

  const changeParamsInput = async (
    e,
    _componentIndex,
    _methodIndex,
    _inputIndex
  ) => {
    var newInputsData = [...inputsData];

    if (
      components[_componentIndex].methods[_methodIndex].dataType[0][
        _inputIndex
      ].includes("[]")
    ) {
      newInputsData[_componentIndex][_methodIndex][0][_inputIndex] =
        e.target.value.split(",");
    } else {
      newInputsData[_componentIndex][_methodIndex][0][_inputIndex] =
        e.target.value;
    }

    setInputsData(newInputsData);
  };

  const changeValue = async (e, _componentIndex, _methodIndex) => {
    var newValuesData = [...valuesData];
    newValuesData[_componentIndex][_methodIndex] = e.target.value;
    setValuesData(newValuesData);
  };

  const openTab = (_componentIndex, _methodIndex) => {
    var isTabOpen = inputsData[_componentIndex][_methodIndex][2];

    var newInputsData = [...inputsData];
    newInputsData[_componentIndex][_methodIndex][2] = !isTabOpen;

    setInputsData(newInputsData);
  };

  const updateWallet = async (currentAddress) => {
    setCurrentAddress(currentAddress);
  };

  const checkRegister = async (register) => {
    var registerResult = await ame.isRegistered(register);
    setIsRegistered(registerResult);
  };

  const registerNetwork = async () => {
    const response = await toast.promise(
      async () => {
        await ame.registerAmeWorld(currentAddress);
      },
      {
        pending: {
          render: "Pending",
          position: "top-center",
          theme: "dark",
          position: "top-center",
        },
        success: "Success",
        error: "Fail",
      }
    );

    await checkRegister(currentAddress);
  };

  const removeComponent = async (e, _componentAddress, _componentIndex) => {
    var registerResult = await ame.isRegistered(currentAddress);
    if (registerResult) {
      const response = await toast.promise(
        async () => {
          await ame.removeComponents(currentAddress, [_componentAddress]);
        },
        {
          pending: {
            render: "Pending",
            theme: "dark",
            position: "top-center",
          },
          success: {
            render: "Success",
            autoClose: 2500,
            theme: "dark",
            position: "top-center",
          },
          error: {
            render: "Fail",
            autoClose: 2500,
            theme: "dark",
            position: "top-center",
          },
        }
      );

      var newComponent = [...components];
      newComponent.splice(_componentIndex, 1);
      setComponents(newComponent);
    } else {
      toast.warn("Please register first!", {
        position: "top-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const addComponent = async (e, _componentAddress) => {
    var registerResult = await ame.isRegistered(currentAddress);
    if (registerResult) {
      const response = await toast.promise(
        async () => {
          await ame.addComponents(currentAddress, [_componentAddress]);
        },
        {
          pending: {
            render: "Pending",
            position: "top-center",
            theme: "dark",
            position: "top-center",
          },
          success: "Success",
          error: "Fail",
        }
      );
    } else {
      toast.warn("Please register first!", {
        position: "top-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const sendRequest = async (e, _componentIndex, _methodIndex) => {
    var componentAddress = components[_componentIndex].address;

    var methodType =
      components[_componentIndex].methods[_methodIndex].methodType;
    var methodName =
      components[_componentIndex].methods[_methodIndex].methodName;
    var methodRequestParamsType =
      components[_componentIndex].methods[_methodIndex].dataType[0];
    var methodResponseDataType =
      components[_componentIndex].methods[_methodIndex].dataType[1];
    var requestInputData = inputsData[_componentIndex][_methodIndex][0];

    var isValid = true;
    for (var item of requestInputData) {
      if (item == "") {
        isValid = false;
      }
    }

    if (isValid) {
      var reqParamsEncode = ame.encodeRequestParams(
        methodRequestParamsType,
        requestInputData
      );

      console.log("reqParamsEncode", reqParamsEncode);
      if (methodType == 0) {
        var resDataEncode = await ame.sendGetRequest(
          componentAddress,
          methodName,
          reqParamsEncode
        );

        var resDataDecode = ame.decodeResponseData(
          methodResponseDataType,
          resDataEncode
        );

        const resData = Object.values(resDataDecode);

        console.log("resData",resData)

        resData.pop();

        setInputsData((inputsData) => {
          var newInputsData = [...inputsData];
          newInputsData[_componentIndex][_methodIndex][1] = resData;
          return newInputsData;
        });
      } else {
        if (currentAddress != "") {
          var value = valuesData[_componentIndex][_methodIndex];

          if (value != "") {
            value = ame.web3.utils.toWei(value, "ether");
          } else {
            value = 0;
          }

          if (methodType == 1) {
            const response = await toast.promise(
              async () => {
                var txResult = await ame.sendPostRequestWeb3js(
                  componentAddress,
                  methodName,
                  reqParamsEncode,
                  currentAddress,
                  value
                );

                //Update Transaction detail

                const transaction = await ame.web3.eth.getTransaction(
                  txResult.transactionHash
                );

                transaction.value = ame.web3.utils.fromWei(
                  transaction.value,
                  "ether"
                );

                var newTransactionsData = [...transactionsData];
                transactionsData[_componentIndex][_methodIndex] = transaction;

                setTransactionsData(newTransactionsData);

                if (
                  methodResponseDataType.length != 0 &&
                  txResult.events != undefined
                ) {
                  var resDataDecode = ame.decodeResponseData(
                    methodResponseDataType,
                    txResult.events.Response.returnValues[0]
                  );

                  const resData = Object.values(resDataDecode);
                  resData.pop();

                  setInputsData((inputsData) => {
                    var newInputsData = [...inputsData];
                    newInputsData[_componentIndex][_methodIndex][1] = resData;
                    return newInputsData;
                  });
                }
              },
              {
                pending: {
                  render: "Pending",
                  theme: "dark",
                  position: "top-center",
                },
                success: {
                  render: "Success",
                  autoClose: 2500,
                  theme: "dark",
                  position: "top-center",
                },
                error: {
                  render: "Fail",
                  autoClose: 2500,
                  theme: "dark",
                  position: "top-center",
                },
              }
            );
          } else {
            const response = await toast.promise(
              async () => {
                var txResult = await ame.sendPutRequestWeb3js(
                  componentAddress,
                  methodName,
                  reqParamsEncode,
                  currentAddress,
                  value
                );

                //Update Transaction detail

                const transaction = await ame.web3.eth.getTransaction(
                  txResult.transactionHash
                );

                transaction.value = ame.web3.utils.fromWei(
                  transaction.value,
                  "ether"
                );

                var newTransactionsData = [...transactionsData];
                transactionsData[_componentIndex][_methodIndex] = transaction;

                setTransactionsData(newTransactionsData);

                if (methodResponseDataType.length != 0) {
                  var resDataDecode = ame.decodeResponseData(
                    methodResponseDataType,
                    txResult.events.Response.returnValues[0]
                  );

                  const resData = Object.values(resDataDecode);
                  resData.pop();

                  setInputsData((inputsData) => {
                    var newInputsData = [...inputsData];
                    newInputsData[_componentIndex][_methodIndex][1] = resData;
                    return newInputsData;
                  });
                }
              },
              {
                pending: {
                  render: "Pending",
                  theme: "dark",
                  position: "top-center",
                },
                success: {
                  render: "Success",
                  autoClose: 2500,
                  theme: "dark",
                  position: "top-center",
                },
                error: {
                  render: "Fail",
                  autoClose: 2500,
                  theme: "dark",
                  position: "top-center",
                },
              }
            );
          }
        } else {
          toast.warn("Please connect wallet!", {
            position: "top-center",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
        }
      }
    } else {
      toast.warn("Request parameter error!", {
        position: "top-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const toggleDrawer = () => {
    setIsOpen((prevState) => !prevState);
  };

  return (
    <div className="ScanContainer">
      <ToastContainer />
      {/* <Modal footer={""} open={isOpen} width={800} >
      <div className="tutorial">
          <Tutorial></Tutorial>
        </div>
      </Modal> */}

      <div className="ScanHeader">
        <div className="ScanTitle">Ame Components Scan</div>
        <ul className="ScanHeaderMenu">
          <li>
            <a href="https://ame.network" target="_blank">
              About Ame Network
            </a>
          </li>
          <li>
            <a
              href="https://github.com/HelloRickey/ame/tree/main/contracts/Components"
              target="_blank"
            >
              Components
            </a>
          </li>
          {/* <li onClick={toggleDrawer}>How to Use It</li> */}
        </ul>
      </div>

      <div className="Network">
        <div className="NetworkLabel">Network</div>

        <ConfigProvider
          theme={{
            components: {
              Select: {
                colorText: "#fff",
                optionSelectedColor: "#fff",

                optionSelectedBg: "#000",
                optionActiveBg: "#363b42",
              },
            },
            token: {
              // colorPrimary: "#fff",
              colorTextPlaceholder: "#fff",
              borderRadius: 4,
              colorBgElevated: "#0d1116",
              colorBgContainer: "#0d1116",
              colorBorder: "#363b42",
              lineWidth: "2px",
            },
          }}
        >
          <Select
            placeholder="Select a network"
            value={networkValue}
            // style={{ width: 200 }}
            onChange={changeNetwork}
            options={options}
            className="Select"
          />
        </ConfigProvider>
      </div>

      <div className="Wallet">
        <div className="WalletLabel">Wallet</div>
        <div className="WalletInfo">
          <Wallet updateWallet={updateWallet}></Wallet>

          {isRegistered ? (
            <div>Registed</div>
          ) : currentAddress != "" ? (
            networkValue != "Select a network" ? (
              <div className="RegisterButton" onClick={registerNetwork}>
                Register
              </div>
            ) : (
              <div></div>
            )
          ) : (
            <div></div>
          )}
        </div>
      </div>

      <div className="AmeQuery">
        <div className="NetworkLabel">Search Component</div>
        <input
          type="text"
          className="AmeInput"
          placeholder="Component address or wallet address"
          value={searchAddress}
          onChange={(e) => {
            setSearchAddress(e.target.value);
          }}
        />
        <div className="SearchButton" onClick={queryContract}>
          Search
        </div>
      </div>
      <div className="ComponentsTitle">Components</div>

      {components.length == 0 ? (
        <div className="NoComponentData">
          <div>
            <img src={ScanIcon} width={60} />
          </div>
          <div>No Data</div>
        </div>
      ) : (
        <ul className="Components">
          {components.map((componentItem, componentIndex) => (
            <li key={componentIndex} className="TabContainer">
              <div className="ComponentAddress">
                <div className="ComponentAddressTitle">
                  {componentItem.address}
                </div>

                {buttonType == 0 ? (
                  <div></div>
                ) : buttonType == 1 ? (
                  <div
                    className="ComponentAddressButton"
                    onClick={(e) => addComponent(e, componentItem.address)}
                  >
                    Add
                  </div>
                ) : (
                  <div
                    className="ComponentAddressButton"
                    onClick={(e) =>
                      removeComponent(e, componentItem.address, componentIndex)
                    }
                  >
                    Remove
                  </div>
                )}
              </div>

              {componentItem.methods.map((methodItem, methodIndex) => (
                <div key={methodIndex} className="TabItem">
                  <div
                    className="TabHeader"
                    onClick={(e) => {
                      openTab(componentIndex, methodIndex);
                    }}
                  >
                    <div className="TabHeaderComponentMethod">
                      <div className="ComponentMethodType">
                        {methodItem.methodType == 0 ? (
                          <span>GET</span>
                        ) : methodItem.methodType == 1 ? (
                          <span>POST</span>
                        ) : (
                          <span>PUT</span>
                        )}
                      </div>
                      <div className="ComponentMethodName">
                        {methodItem.methodName}
                      </div>
                    </div>
                    <div
                      className={
                        inputsData[componentIndex][methodIndex][2]
                          ? "rotate"
                          : ""
                      }
                    >
                      <img src={chevronDown} />
                    </div>
                  </div>

                  <div
                    className="TabBody"
                    hidden={inputsData[componentIndex][methodIndex][2] == false}
                  >
                    <div className="RequestParams">
                      <div className="RequestParamsLeft">
                        <div className="AccordionTitle">Request Params</div>
                        <div className="RequestParamsForm">
                          {methodItem.dataType[0].map(
                            (requestItem, inputIndex) => (
                              <input
                                key={inputIndex}
                                value={
                                  inputsData[componentIndex][methodIndex][0][
                                    inputIndex
                                  ]
                                }
                                className="RequestParamsInput"
                                placeholder={requestItem}
                                onChange={(e) =>
                                  changeParamsInput(
                                    e,
                                    componentIndex,
                                    methodIndex,
                                    inputIndex
                                  )
                                }
                              />
                            )
                          )}
                        </div>

                        {methodItem.methodType == 1 ||
                        methodItem.methodType == 2 ? (
                          <div>
                            <div className="AccordionTitle">Value</div>
                            <input
                              type="number"
                              key={methodIndex}
                              value={valuesData[componentIndex][methodIndex]}
                              className="RequestParamsInput"
                              placeholder="Ether"
                              onChange={(e) =>
                                changeValue(e, componentIndex, methodIndex)
                              }
                            />
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                      <div
                        className="RequestParamsButton"
                        onClick={(e) =>
                          sendRequest(e, componentIndex, methodIndex)
                        }
                      >
                        Send
                      </div>
                    </div>
                    <div className="AccordionTitle">
                      <div>Response</div>
                      <div className="ResponseDataTypes"></div>
                    </div>
                    <div className="Response">
                      {inputsData[componentIndex][methodIndex][1].length ==
                      0 ? (
                        <div className="ResponseNoTip">
                          This function does not have any response values.
                        </div>
                      ) : (
                        inputsData[componentIndex][methodIndex][1].map(
                          (resItem, resIndex) => (
                            <div key={resIndex} className="ResponseValue">
                              <div>{resItem.toString()}</div>
                              <div className="ResponseDataTypeColor">
                                :{methodItem.dataType[1][resIndex]}
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                    {methodItem.methodType == 1 ||
                    methodItem.methodType == 2 ? (
                      <div className="Transaction">
                        <div className="AccordionTitle">Transaction Detail</div>

                        {transactionsData[componentIndex][methodIndex] != "" ? (
                          <div className="TransactionDetail">
                            <div className="TransactionItem">
                              <div className="TransactionItemLabel">Hash:</div>
                              <div className="TransactionItemValue">
                                <a
                                  href={
                                    Chains.get(networkValue).Network
                                      .blockExplorerUrls[0] +
                                    "/tx/" +
                                    transactionsData[componentIndex][
                                      methodIndex
                                    ].hash
                                  }
                                  target="_blank"
                                >
                                  {" "}
                                  {
                                    transactionsData[componentIndex][
                                      methodIndex
                                    ].hash
                                  }
                                </a>
                              </div>
                            </div>
                            <div className="TransactionItem">
                              <div className="TransactionItemLabel">From:</div>
                              <div className="TransactionItemValue">
                                {
                                  transactionsData[componentIndex][methodIndex]
                                    .from
                                }
                              </div>
                            </div>
                            <div className="TransactionItem">
                              <div className="TransactionItemLabel">To:</div>
                              <div className="TransactionItemValue">
                                {
                                  transactionsData[componentIndex][methodIndex]
                                    .to
                                }
                              </div>
                            </div>
                            <div className="TransactionItem">
                              <div className="TransactionItemLabel">Value:</div>
                              <div className="TransactionItemValue">
                                {
                                  transactionsData[componentIndex][methodIndex]
                                    .value
                                }
                                &nbsp;ETH
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default Scan;
