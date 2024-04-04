import React, { useState, useEffect } from "react";
import networks from "./config/networks";
import Web3 from "web3";
import { whatsabi } from "@shazow/whatsabi";
// import "./App.css";
import Select from "react-select";
import { CopyToClipboard } from "react-copy-to-clipboard";
import WorldABI from "./abi/World.json";
import ComponentABI from "./abi/Component.json";
import typesArray from "./config/typesArray";
function App() {
  const [options, setOptions] = useState([]);
  const [networkIndex, setNetworkIndex] = useState(0);
  const [web3, setWeb3] = useState();
  const [worldContract, setWorldContract] = useState("");
  const [entityCount, setEntityCount] = useState();
  const [components, setComponents] = useState([]);
  const [systems, setSystems] = useState([]);
  const [entityInfo, setEntityInfo] = useState({
    entityId: "",
    state: true,
    exist: false,
    show: false,
    components: [],
  });
  const [result, setResult] = useState(0);
  useEffect(() => {
    var options = [];
    for (var index in networks) {
      options.push({ value: index, label: networks[index].chainName });
    }
    setOptions(options);
    changeNetwork(options[0]);
  }, []);

  var changeNetwork = (e) => {
    const network = networks[e.value];
    const web3 = new Web3(network.rpcUrls[0]);
    setWeb3(web3);
    setNetworkIndex(e.value);
  };

  var queryWorld = async () => {
    try {
      const world = new web3.eth.Contract(WorldABI, worldContract);
      const componentAddresses = await world.methods.getComponents().call();
      const systemAddresses = await world.methods.getSystems().call();
      const entityCount = await world.methods.getEntityCount().call();

      const components = [];
      const systems = [];
      //components state
      for (var item of componentAddresses) {
        var componentState = await world.methods.getComponentState(item).call();
        components.push({
          address: item,
          showData: false,
          state: componentState,
          types: "",
          getEntityId: "",
          getData: "",
          getParamsEntityId: "",
          getParamsParams: "",
          getParamsData: "",
        });
      }
      // systems state
      for (var item of systemAddresses) {
        var systemState = await world.methods.getSystemState(item).call();
        systems.push({
          address: item,
          state: systemState,
          showData: false,
          data: [],
        });
      }

      setEntityCount(entityCount.toString());
      setComponents(components);
      setSystems(systems);
      setResult(1);
    } catch (error) {
      setResult(2);
    }
  };

  var getComponentTypes = async (componentIndex) => {
    const componentContract = new web3.eth.Contract(
      ComponentABI,
      components[componentIndex].address
    );

    var types = await componentContract.methods.types().call();

    var dataType;
    if (types[0].length != 0) {
      dataType = 'data type:"';
      for (var index in types[0]) {
        dataType =
          dataType +
          typesArray[parseInt(types[0][index])] +
          (index != types[0].length - 1 ? "," : '"');
      }
    } else {
      dataType = 'data type:""';
    }
    var paramsType;
    if (types[1].length != 0) {
      paramsType = 'params type:"';
      for (var index in types[1]) {
        paramsType =
          paramsType +
          typesArray[parseInt(types[1][index])] +
          (index != types[1].length - 1 ? "," : '"');
      }
    } else {
      paramsType = 'params type:""';
    }

    var componentTypes = dataType + "\r" + paramsType;

    console.log(componentTypes);

    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return { ...item, types: componentTypes };
      } else {
        return item;
      }
    });

    setComponents(newComponents);
  };

  const changeComponentEntityId = (e, componentIndex) => {
    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return { ...item, getEntityId: e.target.value };
      } else {
        return item;
      }
    });
    setComponents(newComponents);
  };

  const getEntityData = async (componentIndex) => {
    var entityId = components[componentIndex].getEntityId;

    var entityData;
    if (entityId == "") {
      entityData = "Please input entity id";
    } else {
      const world = new web3.eth.Contract(WorldABI, worldContract);

      var entityExist = await world.methods.entityExists(entityId).call();

      if (entityExist) {
        const componentContract = new web3.eth.Contract(
          ComponentABI,
          components[componentIndex].address
        );

        var types = await componentContract.methods.types().call();
        var entityDataEncode = await componentContract.methods
          .get(entityId)
          .call();
        if (entityDataEncode == "0x") {
          entityData =
            "0x, " + "please try to use get(params) to get entity data.";
        } else {
          var decodedTypesArray = [];
          for (var item in types[0]) {
            decodedTypesArray.push(typesArray[types[0][item].toString()]);
          }
          var entityDataDecode = web3.eth.abi.decodeParameters(
            decodedTypesArray,
            entityDataEncode
          );
          entityData = entityDataDecode[0] + "," + entityDataDecode[1];
        }
      } else {
        entityData = "Entity does not exist";
      }
    }
    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return { ...item, getData: entityData };
      } else {
        return item;
      }
    });

    setComponents(newComponents);
  };

  const changeParamsEntityId = (e, componentIndex) => {
    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return { ...item, getParamsEntityId: e.target.value };
      } else {
        return item;
      }
    });
    setComponents(newComponents);
  };

  const changeParamsParams = (e, componentIndex) => {
    console.log(e.target.value);
    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return { ...item, getParamsParams: e.target.value };
      } else {
        return item;
      }
    });
    setComponents(newComponents);
  };

  const getEntityParamsData = async (componentIndex) => {
    var entityId = components[componentIndex].getParamsEntityId;
    var paramsParams = components[componentIndex].getParamsParams;

    if (entityId == "" || paramsParams == "") {
      entityData = "Please input entity id and params";
    } else {
      const world = new web3.eth.Contract(WorldABI, worldContract);

      var entityExist = await world.methods.entityExists(entityId).call();

      var entityData;
      if (entityExist) {
        const componentContract = new web3.eth.Contract(
          ComponentABI,
          components[componentIndex].address
        );

        var types = await componentContract.methods.types().call();

        var paramsValueArray;

        if (paramsParams.indexOf != -1) {
          paramsValueArray = paramsParams.split(",");
        } else {
          paramsValueArray = [paramsParams];
        }

        var encodeArray = [];
        for (var item in types[1]) {
          encodeArray.push({
            value: paramsValueArray[item],
            type: typesArray[parseInt(types[1][item])],
          });
        }

        var paramsEncode;

        if ((encodeArray.length = 1)) {
          paramsEncode = Web3.utils.encodePacked(encodeArray[0]);
        } else if ((encodeArray.length = 2)) {
          paramsEncode = Web3.utils.encodePacked(
            encodeArray[0],
            encodeArray[1]
          );
        } else if ((encodeArray.length = 2)) {
          paramsEncode = Web3.utils.encodePacked(
            encodeArray[0],
            encodeArray[1],
            encodeArray[2]
          );
        }

        var entityDataEncode = await componentContract.methods
          .get(entityId, paramsEncode)
          .call();
        if (entityDataEncode == "0x") {
          entityData =
            "0x, " + "please try to use get function to get entity data.";
        } else {
          var decodedTypesArray = [];
          for (var item in types[0]) {
            decodedTypesArray.push(typesArray[types[0][item].toString()]);
          }
          var entityDataDecode = web3.eth.abi.decodeParameters(
            decodedTypesArray,
            entityDataEncode
          );
          entityData = entityDataDecode[0] + "," + entityDataDecode[1];
        }
      } else {
        entityData = "Entity does not exist";
      }
    }
    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return { ...item, getParamsData: entityData };
      } else {
        return item;
      }
    });

    setComponents(newComponents);
  };

  const changeEntityId = (e) => {
    setEntityInfo({ ...entityInfo, entityId: e.target.value });
  };

  const getEntityInfo = async () => {
    var entityId = entityInfo.entityId;

    if (entityId == "") {
      setEntityInfo({ ...entityInfo, show: true, exist: false });
    } else {
      const world = new web3.eth.Contract(WorldABI, worldContract);
      var entityExist = await world.methods.entityExists(entityId).call();

      if (entityExist) {
        var entityComponents = await world.methods
          .getEntityComponents(entityId)
          .call();

        var entityState = await world.methods.getEntityState(entityId).call();

        setEntityInfo({
          ...entityInfo,
          show: true,
          exist: true,
          components: entityComponents,
          state: entityState,
        });
      } else {
        setEntityInfo({ ...entityInfo, show: true, exist: false });
      }
    }
  };

  const copyEGAddress = () => {
    setWorldContract(networks[networkIndex].eg);
  };

  const showSystemMore = async (systemIndex) => {
    var systemData = [];
    if (systems[systemIndex].data.length == 0) {
      var systemCode = await web3.eth.getCode(systems[systemIndex].address);
      const abi = whatsabi.abiFromBytecode(systemCode);
      const signatureLookup = new whatsabi.loaders.OpenChainSignatureLookup();
      for (var item of abi) {
        if (item.type == "function") {
          var systemFunction = await signatureLookup.loadFunctions(
            item.selector
          );
          systemData.push({
            selector: item.selector,
            systemFunction: systemFunction[0],
            payable: item.payable ? "true" : "false",
          });
        }
      }
    } else {
      systemData = systems[systemIndex].data;
    }

    const newSystems = systems.map((item, index) => {
      if (index === systemIndex) {
        return {
          ...item,
          showData: !systems[systemIndex].showData,
          data: systemData,
        };
      } else {
        return item;
      }
    });

    setSystems(newSystems);
  };

  const showComponentMore = (componentIndex) => {
    const newComponents = components.map((item, index) => {
      if (index === componentIndex) {
        return {
          ...item,
          showData: !components[componentIndex].showData,
        };
      } else {
        return item;
      }
    });

    setComponents(newComponents);
  };
  return (
    <div className="App">
      <h1>ECScan</h1>
      <div className="WorldQuery">
        <Select
          value={options[networkIndex]}
          className="NetworkSelect"
          options={options}
          placeholder="select a network"
          onChange={changeNetwork}
          styles={{
            control: (base, state) => ({
              ...base,
              border: "1px solid #323439",
              background: "#19191C",
              color: "#fff",
            }),
            singleValue: (base) => ({
              ...base,
              color: "#fff",
            }),
            option: (base, state) => ({
              ...base,
              color: state.isSelected ? "#fff" : "#fff",
              backgroundColor: state.isSelected ? "#19191C" : "",
              "&:hover": {
                color: "#000",
                background: "#fff",
              },
            }),
            menu: (base, state) => ({
              ...base,
              background: "#2C2D31",
            }),
          }}
        />
        <input
          type="text"
          className="WorldInput"
          placeholder="World Contract Address"
          value={worldContract}
          onChange={(e) => {
            setWorldContract(e.target.value);
          }}
        />
        <div className="SearchButton" onClick={queryWorld}>
          Search
        </div>
        <div className="EGAddress" onClick={copyEGAddress}>
          e.g., {networks[networkIndex].eg}
        </div>
      </div>
      {result == 1 ? (
        <div className="QueryResult">
          <div className="Entities">
            <h2>Entities ({entityCount})</h2>
            <div className="EntityQuery">
              <input
                placeholder="Entity Id, e.g., 0"
                className="EntityQueryInput"
                onChange={(e) => {
                  changeEntityId(e);
                }}
              />
              <div
                className="EntityQueryButton"
                onClick={getEntityInfo.bind(this)}
              >
                Query Entity Info
              </div>
            </div>

            {entityInfo.show ? (
              entityInfo.exist ? (
                <div className="EntityResult">
                  <div className="EntityState">
                    <h4>
                      Entity State:
                      {entityInfo.state ? (
                        <span className="available">Available</span>
                      ) : (
                        <span className="unavailable">&nbsp;Unavailable</span>
                      )}
                    </h4>
                  </div>
                  <div className="EntityComponents">
                    <h4>Components attached to the entity</h4>
                    <ul>
                      {entityInfo.components.length > 0 ? (
                        entityInfo.components.map((item, index) => (
                          <li key={index}>
                            <div className="EntityComponentAddress">{item}</div>
                            <div className="EntityComponentGroup">
                              <CopyToClipboard text={item}>
                                <div className="EntityComponentCopy">Copy</div>
                              </CopyToClipboard>

                              <div className="EntityComponentLink">
                                |{" "}
                                <a
                                  href={
                                    networks[networkIndex].blockExplorerUrls +
                                    "/address/" +
                                    item
                                  }
                                  target="_blank"
                                >
                                  View on Explorer
                                </a>
                             
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <div>No component is attached</div>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="EntityInfoTip">Entity does not exist</div>
              )
            ) : (
              <div></div>
            )}
          </div>

          <div className="Component">
            <h2>Registered Components({components.length})</h2>
            <ul className="List">
              {components.map((item, index) => (
                <li key={index}>
                  <div className="ListHeader">
                    <div className="ListAddress">
                      {item.address}
                      {item.state ? (
                        <span className="available">&nbsp;Available</span>
                      ) : (
                        <span className="unavailable">&nbsp;Unavailable</span>
                      )}
                    </div>

                    <div className="ListHeaderBtns">
                      <div
                        className="ListHeaderShowMore"
                        onClick={showComponentMore.bind(this, index)}
                      >
                        {item.showData?"Show Less":"Show More"}&nbsp;|&nbsp;
                      </div>

                      <CopyToClipboard text={item.address}>
                        <div className="ListHeaderCopy">Copy</div>
                      </CopyToClipboard>

                      <div className="ListHeaderLink">
                        &nbsp;|&nbsp;
                        <a
                          href={
                            networks[networkIndex].blockExplorerUrls +
                            "/address/" +
                            item.address
                          }
                          target="_blank"
                        >
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                  {item.showData ? (
                    <div className="ListBody">
                      <div className="ComponentFunction">
                        <div
                          className="ComponentFunctionButton"
                          onClick={getComponentTypes.bind(this, index)}
                        >
                          types
                        </div>

                        <div className="ComponentFunctionValue">
                          {item.types}
                        </div>
                      </div>
                      <div className="ComponentFunction">
                        <div className="ComponentFunctionGroup">
                          <input
                            className="ComponentFunctionInput"
                            placeholder="Entity Id"
                            type="number"
                            onChange={(e) => changeComponentEntityId(e, index)}
                          />
                          <div
                            className="ComponentFunctionButton"
                            onClick={getEntityData.bind(this, index)}
                          >
                            get
                          </div>
                        </div>
                        <div className="ComponentFunctionValue">
                          {item.getData}
                        </div>
                      </div>
                      <div className="ComponentFunction">
                        <div className="ComponentFunctionGroup">
                          <input
                            className="ComponentFunctionInput"
                            placeholder="Entity Id"
                            type="number"
                            onChange={(e) => changeParamsEntityId(e, index)}
                          />
                          <input
                            className="ComponentFunctionInput"
                            placeholder="params"
                            onChange={(e) => changeParamsParams(e, index)}
                          />
                          <div
                            className="ComponentFunctionButton"
                            onClick={getEntityParamsData.bind(this, index)}
                          >
                            get(params)
                          </div>
                        </div>
                        <div className="ComponentFunctionValue">
                          {item.getParamsData}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="System">
            <h2>Registered Systems({systems.length})</h2>
            <ul className="List">
              {systems.map((item, index) => (
                <li key={index}>
                  <div className="ListHeader">
                    <div className="ListAddress">
                      {item.address}
                      {item.state ? (
                        <span className="available">&nbsp;Available</span>
                      ) : (
                        <span className="unavailable">&nbsp;Unavailable</span>
                      )}
                    </div>

                    <div className="ListHeaderBtns">
                      <div
                        className="ListHeaderShowMore"
                        onClick={showSystemMore.bind(this, index)}
                      >
                        {item.showData?"Show Less":"Show More"}&nbsp;|&nbsp;
                      </div>
                      <CopyToClipboard text={item.address}>
                        <div className="ListHeaderCopy">Copy</div>
                      </CopyToClipboard>
                      <div className="ListHeaderLink">
                        &nbsp;|&nbsp;
                        <a
                          href={
                            networks[networkIndex].blockExplorerUrls +
                            "/address/" +
                            item.address
                          }
                          target="_blank"
                        >
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                  {item.showData ? (
                    <div className="ListBody">
                      {item.data.map((systemDataItem, systemDataIndex) => (
                        <div key={systemDataIndex} className="SystemMore">
                          selector: {systemDataItem.selector},&nbsp; function:
                          {systemDataItem.systemFunction},&nbsp; payable:
                          {systemDataItem.payable}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div></div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : result == 0 ? (
        <div className="AboutEECS">
          <div>
            ECScan is an EthereumECS data display tool. You can use it to query
            the Entities, Components, and Systems information of the world
            contract.
          </div>
          <a href="https://github.com/HelloRickey/EthereumECS" target="_blank">
            <div className="LearnMoreButton">Learn more about EthereumECS</div>
          </a>
        </div>
      ) : (
        <div className="ContractError">
          This contract is not a standard EthereumECS World contract.
        </div>
      )}
    </div>
  );
}

export default App;
