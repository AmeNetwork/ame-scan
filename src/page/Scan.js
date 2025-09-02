import React, { useState, useEffect, memo } from "react";
import "./Scan.css";
import chevronDown from "../assets/chevron-down.svg";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ScanIcon from "../assets/scanIcon.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/logo.svg";
import {
  encodeAbiParameters,
  decodeAbiParameters,
  formatEther,
  parseEther,
  decodeEventLog,
} from "viem";

import typesArray from "./typesArray";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  getChainId,
  getChains,
  getAccount,
} from "@wagmi/core";
import config from "../config";
import abi from "../abi.json";

function Scan() {
  const [searchAddress, setSearchAddress] = useState("");

  const [component, setComponent] = useState("");
  const [inputsData, setInputsData] = useState("");
  const [valuesData, setValuesData] = useState("");
  const [transactionsData, setTransactionsData] = useState("");
  const [explorer, setExplorer] = useState("");
  const [loading, setLoading] = useState(false);

  const sortComponent = (componentData) => {
    var methodsInput = [];
    var methods = componentData.methods;
    for (var i = 0; i < methods.length; i++) {
      methodsInput.push([
        new Array(methods[i].dataType[0].length).fill(""),
        new Array(methods[i].dataType[1].length).fill(""),
        false,
      ]);
    }
    setInputsData(methodsInput);

    var values = new Array(componentData.methods.length).fill("");
    var transactions = new Array(componentData.methods.length).fill("");
    setValuesData(values);
    setTransactionsData(transactions);
  };

  const queryComponent = async (searchAddress) => {
    const options = await readContract(config, {
      address: searchAddress,
      abi: abi,
      functionName: "options",
      args: [],
    });
    var componentObj = {
      address: searchAddress,
      methods: [],
      instructions: [],
    };

    for (var methodType of options) {
      methodType = parseInt(methodType);

      var methodNames = await readContract(config, {
        address: searchAddress,
        abi: abi,
        functionName: "getMethods",
        args: [methodType],
      });

      for (var methodName of methodNames) {
        var instruction = await readContract(config, {
          address: searchAddress,
          abi: abi,
          functionName: "getMethodInstruction",
          args: [methodName],
        });
        componentObj.instructions.push(instruction);

        var dataType = await readContract(config, {
          address: searchAddress,
          abi: abi,
          functionName: "getMethodReqAndRes",
          args: [methodName],
        });

        dataType[0] = dataType[0].map((num) => typesArray[Number(num)]);
        dataType[1] = dataType[1].map((num) => typesArray[Number(num)]);

        componentObj.methods.push({
          methodName: methodName,
          methodType: methodType,
          dataType: dataType,
        });
      }
    }
    return componentObj;
  };

  const queryContract = async () => {
    try {
      setLoading(true);
      var componentData = await queryComponent(searchAddress);
      setLoading(false);
      setComponent(componentData);
      sortComponent(componentData);
    } catch (error) {
      setLoading(false);
      toast.warn(
        "Can not query the component, please check network and address",
        {
          position: "top-center",
          autoClose: 3500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
      setComponent("");
    }
  };

  const changeParamsInput = async (
    e,

    _methodIndex,
    _inputIndex
  ) => {
    var newInputsData = [...inputsData];

    if (
      component.methods[_methodIndex].dataType[0][_inputIndex].includes("[]")
    ) {
      newInputsData[_methodIndex][0][_inputIndex] = e.target.value.split(",");
    } else {
      newInputsData[_methodIndex][0][_inputIndex] = e.target.value;
    }

    setInputsData(newInputsData);
  };

  const changeValue = async (e, _methodIndex) => {
    var newValuesData = [...valuesData];
    newValuesData[_methodIndex] = e.target.value;
    setValuesData(newValuesData);
  };

  const openTab = (_methodIndex) => {
    var isTabOpen = inputsData[_methodIndex][2];

    var newInputsData = [...inputsData];
    newInputsData[_methodIndex][2] = !isTabOpen;

    setInputsData(newInputsData);
  };

  const sendRequest = async (e, _methodIndex) => {
    var componentAddress = component.address;

    var methodType = component.methods[_methodIndex].methodType;
    var methodName = component.methods[_methodIndex].methodName;
    var methodRequestParamsType = [];
    var methodResponseDataType = [];

    for (let item of component.methods[_methodIndex].dataType[0]) {
      methodRequestParamsType.push({
        type: item,
      });
    }

    for (let item of component.methods[_methodIndex].dataType[1]) {
      methodResponseDataType.push({
        type: item,
      });
    }
    var requestInputData = inputsData[_methodIndex][0];

    try {
      var reqParamsEncode = encodeAbiParameters(
        methodRequestParamsType,
        requestInputData
      );

      if (methodType == 0) {
        const resDataEncode = await readContract(config, {
          abi: abi,
          address: componentAddress,
          functionName: "get",
          args: [methodName, reqParamsEncode],
        });

        var resDataDecode = decodeAbiParameters(
          methodResponseDataType,
          resDataEncode
        );

        const resData = Object.values(resDataDecode);
        resData.pop();

        setInputsData((inputsData) => {
          var newInputsData = [...inputsData];
          newInputsData[_methodIndex][1] = resData;
          return newInputsData;
        });
      } else {
        const currentAddress = getAccount(config);
        if (currentAddress != "") {
          var value = valuesData[_methodIndex];

          if (value != "") {
            value = parseEther(value);
          } else {
            value = 0;
          }

          const response = await toast.promise(
            async () => {
              const txhash = await writeContract(config, {
                address: componentAddress,
                abi: abi,
                functionName: methodType == 1 ? "post" : "put",
                args: [methodName, reqParamsEncode],
                value: value,
              });
              const receipt = await waitForTransactionReceipt(config, {
                hash: txhash,
              });

              var newTransactionsData = [...transactionsData];
              newTransactionsData[_methodIndex] = receipt;
              setTransactionsData(newTransactionsData);

              const chainId = getChainId(config);
              const chains = getChains(config);

              var blockExplorers = {};
              for (let item of chains) {
                if (item.id == chainId) {
                  blockExplorers = item.blockExplorers;
                }
              }

              var explorer = blockExplorers.default.url;
              setExplorer(explorer);

              //event

              if (
                methodResponseDataType.length != 0 &&
                receipt.logs.length != 0
              ) {
                console.log(receipt);

                const decodedEvent = decodeEventLog({
                  abi: abi,
                  data: receipt.logs[0].data,
                  topics: receipt.logs[0].topics,
                });

                var resDataDecode = decodeAbiParameters(
                  methodResponseDataType,
                  decodedEvent.args._response
                );

                setInputsData((inputsData) => {
                  var newInputsData = [...inputsData];
                  newInputsData[_methodIndex][1] = resDataDecode;
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
    } catch (error) {
      toast.warn("request fail, please check request params", {
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

  return (
    <div>
      <div className="ScanHeader">
        <div className="ScanTitle">
          <img src={logo} width={120} />
        </div>
        <ul className="ScanHeaderMenu">
          <li>
            <a href="https://ame.network" target="_blank">
              Ame Network
            </a>
          </li>

          <li>
            <a href="https://docs.ame.network/ame-scan" target="_blank">
              Tutorial
            </a>
          </li>
          <li>
            <a href="https://github.com/AmeNetwork/ame-scan" target="_blank">
              Github
            </a>
          </li>
        </ul>
      </div>
      <div className="ScanBigtitle">Ame Components Scan</div>

      <div className="ScanContainer">
        <ToastContainer />

        <div className="Wallet">
          <div className="WalletLabel">Wallet</div>
          <ConnectButton />
        </div>

        <div className="AmeQuery">
          <div className="NetworkLabel">Search Component</div>
          <input
            type="text"
            className="AmeInput"
            placeholder="Please enter component address"
            value={searchAddress}
            onChange={(e) => {
              setSearchAddress(e.target.value);
            }}
          />
          <div className="SearchButton" onClick={queryContract}>
            Search
          </div>
        </div>

        <div className="NoComponentData" hidden={!loading}>
          <div>
            <img src={ScanIcon} width={60} />
          </div>
          <div>loading</div>
        </div>
        {
          (component == "" ? (
            <div></div>
          ) : (
            <div>
              <div className="ComponentsTitle">Component</div>
              <div className="TabContainer">
                <div className="ComponentAddress">
                  <div className="ComponentAddressTitle">
                    {component.address}
                  </div>
                </div>

                {component.methods.map((methodItem, methodIndex) => (
                  <div key={methodIndex} className="TabItem">
                    <div
                      className="TabHeader"
                      onClick={(e) => {
                        openTab(methodIndex);
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
                        className={inputsData[methodIndex][2] ? "rotate" : ""}
                      >
                        <img src={chevronDown} />
                      </div>
                    </div>

                    <div
                      className="TabBody"
                      hidden={inputsData[methodIndex][2] == false}
                    >
                      <div className="RequestParams">
                        <div className="RequestParamsLeft">
                          <div className="InstructionTitle">Instruction</div>
                          <div className="InstructionValue">
                            {component.instructions[methodIndex]}
                          </div>

                          <div className="AccordionTitle">Request Params</div>
                          <div className="RequestParamsForm">
                            {methodItem.dataType[0].map(
                              (requestItem, inputIndex) => (
                                <input
                                  key={inputIndex}
                                  value={inputsData[methodIndex][0][inputIndex]}
                                  className="RequestParamsInput"
                                  placeholder={requestItem}
                                  onChange={(e) =>
                                    changeParamsInput(
                                      e,
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
                                value={valuesData[methodIndex]}
                                className="RequestParamsInput"
                                placeholder="Ether"
                                onChange={(e) => changeValue(e, methodIndex)}
                              />
                            </div>
                          ) : (
                            <div></div>
                          )}
                        </div>
                        <div
                          className="RequestParamsButton"
                          onClick={(e) => sendRequest(e, methodIndex)}
                        >
                          Send
                        </div>
                      </div>
                      <div className="AccordionTitle">
                        <div>Response</div>
                        <div className="ResponseDataTypes"></div>
                      </div>
                      <div className="Response">
                        {inputsData[methodIndex][1].length == 0 ? (
                          <div className="ResponseNoTip">
                            This method does not have any response values.
                          </div>
                        ) : (
                          inputsData[methodIndex][1].map(
                            (resItem, resIndex) => (
                              <div key={resIndex} className="ResponseValue">
                                <div className="ResponseValueData">
                                  {resItem.toString()}
                                </div>
                                <div className="ResponseDataTypeColor">
                                  :{methodItem.dataType[1][resIndex]}
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>

                      {(methodItem.methodType != 0) &
                      (transactionsData[methodIndex] != "") ? (
                        <div className="Transaction">
                          <div className="AccordionTitle">Transaction Hash</div>

                          <div className="TransactionDetail">
                            <div className="TransactionItem">
                              <a
                                href={
                                  explorer +
                                  "/tx/" +
                                  transactionsData[methodIndex].transactionHash
                                }
                                target="_blank"
                              >
                                {transactionsData[methodIndex].transactionHash}
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
export default Scan;
