class apiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    console.log(queryString)
  }

  search() {
    const keyword = this.queryString.keyword
      ? { name: { $regex: this.queryString.keyword, $options: "i" } }
      : {};
    this.query = this.query.find(keyword);
    return this;
  }

  filter() {
    const queryCopy = {...this.queryString};
    const removeitems = ["keyword", "limit", "page"];
    removeitems.forEach((element) => {
      delete queryCopy[element];
    });
  
    if(queryCopy.sort==="hightolow"){
     this.query = this.query.sort({price:-1});
    }
    else if(queryCopy.sort==="lowtohigh"){
      this.query = this.query.sort({price:1});
    }
    else if(queryCopy.sort==="atoz"){
      this.query = this.query.sort({name:1});
    }
    else if(queryCopy.sort==="ztoa"){
      this.query = this.query.sort({name:-1});
    }
    else if(queryCopy.sort==="dateasc"){
      this.query = this.query.sort({createdat:-1});
    }
    else if(queryCopy.sort==="datedesc"){
      this.query = this.query.sort({createdat:1});
    }

    delete queryCopy["sort"];

    let queryString = JSON.stringify(queryCopy);


    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (key) => `$${key}`);
    queryString = JSON.parse(queryString);
    console.log(queryString)      
    this.query = this.query.find(queryString);
    return this;
  }

  pagination(resultPerPage) {
    const page = this.queryString.page || 1;
    this.query=this.query.limit(resultPerPage).skip((resultPerPage)*(page-1))
    
    return this;
  }
}

module.exports = apiFeatures;
