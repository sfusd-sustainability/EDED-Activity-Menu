import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import Filter from '../components/filter'
import Activities from '../components/activities'

import styled from 'styled-components'
import s from './index.module.css'

import { connect } from 'react-redux'
import { actions } from '../data/app'

import stream from 'stream'
import csv from 'csv-parser'

class Index extends React.Component {
  constructor() {
    super();
    this.state = {
      data: {
        categories: [],
        types: [],
        points: {
          min: 0,
          max: 0
        }
      }
    };
  }
  handleActivityData(raw) {
    let s = new stream.Readable();
    s._read = () => {};
    s.push(raw);
    s.push(null);
    s.pipe(csv())
      .on('data', (data) => {
        //fix category and type data
        data["Category"] = data["Category"].split(',');
        data["Type"] = data["Type"].split(',');

        var state = this.state;
        //add categories
        for (var cat of data["Category"]) {
          if(!this.state.data.categories.includes(cat))
            if(cat !== "All")
              state.data.categories.push(cat);
        }
        //add types
        for (var type of data["Type"]) {
          if(!this.state.data.types.includes(type))
            state.data.types.push(type);
        }
        //update max points
        if(this.state.data.points.max < data["Points"])
          state.data.points.max = data["Points"];
        //update state
        this.setState(state);
     })
       .on('end', () => {
         console.log("done loading!");
         let s2 = new stream.Readable();
         s2._read = () => {};
         s2.push(raw);
         s2.push(null);
         s2.pipe(csv())
           .on('data', (data) => {
             //fix category and type data
             data["Category"] = data["Category"].split(',');
             data["Type"] = data["Type"].split(',');

             //fix category "All";
             if (data["Category"].includes("All"))
               data["Category"] = this.state.data.categories.slice(0);

             //fix link data
             data["Links"] = [
              {
                "Link": data["Link"],
                "Text": data["Link Text"]
              },
              {
                "Link": data["Link 2"],
                "Text": data["Link Text 2"]
              },
              {
                "Link": data["Link 3"],
                "Text": data["Link Text 3"]
              },
             ];

             //add to store
             this.props.addActivity(data);
          });
     });
  }
  componentDidMount() {
    var url = process.env.GATSBY_DATA_URL;
    var state = this.state;
    if (!url) {
      state.error = "Error: URL for activities data not found";
      this.setState(state);
      return;
    }
    this.request = new XMLHttpRequest();
    this.request.open("GET", url);
    this.request.onreadystatechange = (e) => {
      var req = this.request;
      if (req.readyState === 4)
        if (req.status === 200) {
          this.handleActivityData(req.responseText);
        } else {
          this.setState({error: "Error: "+req.statusText});
          return;
        }
    };
    this.request.onreadystatechange.bind(this);

    //send request here
    this.request.send();
    this.setState(state);
  }
  render() {
    let Header = styled.h2`
      font-family: Oswald;
      font-size: 80px;
      color: #525252;
      font-weight: normal;
      margin: 41px 0px 13px 0;
    `;
    return (
      <Layout>
        <Header>{this.props.data.site.siteMetadata.pageTitle}</Header>
        <div className={s.wrapper}>
          <Filter
            categories={this.state.data.categories}
            types={this.state.data.types}
            maxPoints={this.state.data.points.max}/>
          <Activities />
        </div>
      </Layout>
    );
  }
}

export default connect(
  null,
  {addActivity: actions.addActivity}
)(Index);

export const query = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        pageTitle
      }
    }
  }
`;
