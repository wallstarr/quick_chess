import {useDispatch} from "react-redux";
import {pauseMoveList} from "../../../../../Redux/Action/prevGamViewActions";
import {faPause} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export function PrevMovePausetButton() {
    const dispatch = useDispatch()

    function handleStartOnClick(e) {
        e.preventDefault();
        dispatch(pauseMoveList(false))
    }

    return (
        <button className="bg-transparent hover:bg-violet-900 active:shadow-violet-950 py-2 px-4 rounded shadow shadow-white shadow-md"
            key={"PrevMovePauseButton"}
            id={"PrevMovePauseButton"}
            onClick={(e)=>{handleStartOnClick(e)}}
        ><FontAwesomeIcon icon={faPause} color={"white"} size={"xl"} alignmentBaseline={"central"}/></button>
    )
}