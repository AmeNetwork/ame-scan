import "./Tutorial.css";
import t1 from "../../assets/tutorials/t1.png";
import t2 from "../../assets/tutorials/t2.png";
import t3 from "../../assets/tutorials/t3.png";
import t4 from "../../assets/tutorials/t4.png";
import t5 from "../../assets/tutorials/t5.png";
function Tutorial(props) {
  return (
    <div className="TutorialContainer">
      <div className="TutorialHeader">Tutorial</div>

      <div className="TutorialBody">
        <p className="TutorialTit">1. Please select a network first</p>
        <div className="TutorialImage">
          <img src={t1} width="100%" />
        </div>
        <p className="TutorialTit">2. Connect your wallet</p>
        <div className="TutorialImage">
          <img src={t2} width="100%" />
        </div>
        <p className="TutorialTit">3. Register as a new user</p>
        <div className="TutorialImage">
          <img src={t3} width="100%" />
        </div>
        <p className="TutorialTit">4. Search for the component you want to interact with</p>
        <div className="TutorialImage">
          <img src={t4} width="100%" />
        </div>
        <p className="TutorialTit">5. Call the GET, POST, PUT and other methods of the component</p>
        <div className="TutorialImage">
          <img src={t5} width="100%" />
        </div>
      </div>
    </div>
  );
}
export default Tutorial;
