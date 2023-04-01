



function beautifyIntegers(text) {
    text.split(" ").filter(c => {
        if (!isNaN(parseInt(c))) {
            text = text.replace(c, parseInt(c).toLocaleString())
        }
    });
    return text;
    
};

module.exports = {
    beautifyIntegers
}