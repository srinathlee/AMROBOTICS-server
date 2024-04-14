class apiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
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
