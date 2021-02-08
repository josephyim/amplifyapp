import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
import { listBlogs } from './graphql/queries';
import { createBlog as createBlogMutation, deleteBlog as deleteBlogMutation } from './graphql/mutations';

const initialFormState = { name: ''}

function App() {
  const [blogs, setBlogs] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    const apiData = await API.graphql({ query: listBlogs });
    setBlogs(apiData.data.listBlogs.items);
  }

  async function createBlog() {
    if (!formData.name) return;
    await API.graphql({ query: createBlogMutation, variables: { input: formData } });
    setBlogs([ ...blogs, formData ]);
    setFormData(initialFormState);
  }

  async function deleteBlog({ id }) {
    const newBlogsArray = blogs.filter(blog => blog.id !== id);
    setBlogs(newBlogsArray);
    await API.graphql({ query: deleteBlogMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>My Blogs App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Blog name"
        value={formData.name}
      />
      <button onClick={createBlog}>Create blog</button>
      <div style={{marginBottom: 30}}>
        {
          blogs.map(blog => (
            <div key={blog.id || blog.name}>
              <h2>{blog.name}</h2>
              <h2>{blog.id}</h2>
              <button onClick={() => deleteBlog(blog)}>Delete blog</button>
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
