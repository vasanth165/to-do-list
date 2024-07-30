require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const _ = require("lodash");

const day = date.getDate();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URL);
const itemsSchema = new Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({name: "Welcome to my To Do List"});

const item2 = new Item({name: "Write and use + button add new To Do "});

const item3 = new Item({name: "<-- Use checkbox to remove To Do"});

const defaultItems = [item1, item2, item3];


const listSchema = new Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  
  Item.find().then(function (items){
    if (items.length === 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Success")
      }).catch(function (err) {
        console.log(err)
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: day, newListItems: items});
    };
  });
});

app.post("/", function(req, res){

  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  });

  if (listName === day) {
    item.save();
    res.redirect("/");  
  } else {
    List.findOne({name: listName}).then(function(foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndDelete(checkedItemId).then(function () {
      res.redirect("/");
    }).catch(function (err) {
      console.log(err)
    });
  } else {
    List.findOneAndUpdate({name:listName},{$pull:{items: {_id: checkedItemId}}}).then(function(result) {
      if (result) {
        res.redirect("/" + listName);
      }
    });
  }
 
})

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  if (customListName === "favicon.ico") {
    res.redirect("/");
  } else {

  List.findOne({name: customListName}).then(function(result) {
    if (!result) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      
      list.save();
      res.redirect("/"+customListName);
    } else {
      res.render("list", {listTitle: result.name, newListItems: result.items});
    }
  }).catch(function(err) {
    console.log(err)
  });
  };
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

// process.env.PORT