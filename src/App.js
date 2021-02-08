import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
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

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchBlogs();
  }
  
  async function fetchBlogs() {
    const apiData = await API.graphql({ query: listBlogs });
    const blogsFromAPI = apiData.data.listBlogs.items;
    await Promise.all(blogsFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setBlogs(apiData.data.listBlogs.items);
  }

  async function createBlog() {
    if (!formData.name) return;
    await API.graphql({ query: createBlogMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
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
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createBlog}>Create blog</button>
      <div style={{marginBottom: 30}}>
        {
          blogs.map(blog => (
            <div key={blog.id}>
              <h2>{blog.name}</h2>
              <button onClick={() => deleteBlog(blog)}>Delete blog</button>
              {
                blog.image && <img src={blog.image} style={{width: 400}} />
              }
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
