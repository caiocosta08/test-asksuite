//AAAA-MM-DD -> DDMMAAAA
const dateFormat = (date) => {
    date = date.split("-");
    return date[2] + date[1] + date[0];
}

//checkin < checkout
const dateValidation = ({ checkin, checkout }) => {
    checkin = checkin + "T:12:00:00";
    checkout = checkout + "T:12:00:00";

    if(checkin < checkout) return true;
    else return false;
}

module.exports = { dateFormat, dateValidation }