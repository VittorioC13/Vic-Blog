// Comment System
(function() {
  // Get the current post ID from the page
  const postId = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  const AUTHOR_NAME = 'Victor'; // Your name for highlighting your replies
  
  // Initialize comments
  function initComments() {
    const comments = loadComments();
    renderComments(comments);
    setupCommentForm();
  }
  
  // Load comments from localStorage
  function loadComments() {
    const stored = localStorage.getItem('blog_comments');
    if (!stored) return {};
    try {
      const allComments = JSON.parse(stored);
      return allComments[postId] || [];
    } catch (e) {
      console.error('Error loading comments:', e);
      return [];
    }
  }
  
  // Save comments to localStorage
  function saveComments(comments) {
    const stored = localStorage.getItem('blog_comments');
    let allComments = {};
    if (stored) {
      try {
        allComments = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored comments:', e);
      }
    }
    allComments[postId] = comments;
    localStorage.setItem('blog_comments', JSON.stringify(allComments));
  }
  
  // Setup comment form
  function setupCommentForm() {
    const form = document.getElementById('comment-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameInput = document.getElementById('comment-name');
      const contentInput = document.getElementById('comment-content');
      const anonymousCheck = document.getElementById('comment-anonymous');
      
      const name = anonymousCheck.checked ? 'Anonymous' : (nameInput.value.trim() || 'Anonymous');
      const content = contentInput.value.trim();
      
      if (!content) {
        alert('Please enter a comment');
        return;
      }
      
      const comment = {
        id: Date.now().toString(),
        author: name,
        content: content,
        date: new Date().toISOString(),
        replies: [],
        isAuthor: name.toLowerCase() === AUTHOR_NAME.toLowerCase()
      };
      
      const comments = loadComments();
      comments.push(comment);
      saveComments(comments);
      
      // Reset form
      nameInput.value = '';
      contentInput.value = '';
      anonymousCheck.checked = false;
      nameInput.disabled = false;
      
      // Re-render comments
      renderComments(comments);
    });
    
    // Handle anonymous checkbox
    const anonymousCheck = document.getElementById('comment-anonymous');
    const nameInput = document.getElementById('comment-name');
    
    if (anonymousCheck && nameInput) {
      anonymousCheck.addEventListener('change', function() {
        nameInput.disabled = this.checked;
        if (this.checked) {
          nameInput.value = '';
        }
      });
    }
  }
  
  // Render comments
  function renderComments(comments) {
    const container = document.getElementById('comments-list');
    if (!container) return;
    
    if (comments.length === 0) {
      container.innerHTML = '<p style="color: #666; font-style: italic;">No comments yet. Be the first to comment!</p>';
      return;
    }
    
    container.innerHTML = comments.map(comment => renderComment(comment, false, null)).join('');
    
    // Setup reply buttons - we need to do this recursively
    function setupAllReplyButtons(comments, parentId = null) {
      comments.forEach(comment => {
        setupReplyButton(comment.id, parentId);
        if (comment.replies && comment.replies.length > 0) {
          setupAllReplyButtons(comment.replies, comment.id);
        }
      });
    }
    setupAllReplyButtons(comments);
  }
  
  // Render a single comment
  function renderComment(comment, isReply = false, parentId = null) {
    const date = new Date(comment.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const commentClass = comment.isAuthor ? 'comment author-reply' : 'comment';
    const indentClass = isReply ? ' reply' : '';
    
    let html = `
      <div class="${commentClass}${indentClass}" data-comment-id="${comment.id}">
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(comment.author)}</span>
          <span class="comment-date">${date}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
        <div class="comment-actions">
          <button class="reply-btn" data-reply-to="${comment.id}">Reply</button>
        </div>
        <div id="reply-form-${comment.id}" style="display: none;"></div>
        ${comment.replies && comment.replies.length > 0 ? 
          `<div class="replies">${comment.replies.map(reply => renderComment(reply, true, comment.id)).join('')}</div>` 
          : ''}
      </div>
    `;
    
    return html;
  }
  
  // Setup reply button
  function setupReplyButton(commentId, parentId = null) {
    const button = document.querySelector(`[data-reply-to="${commentId}"]`);
    if (!button) return;
    
    button.addEventListener('click', function() {
      const replyFormContainer = document.getElementById(`reply-form-${commentId}`);
      if (!replyFormContainer) return;
      
      if (replyFormContainer.style.display === 'none' || !replyFormContainer.innerHTML) {
        replyFormContainer.innerHTML = createReplyForm(commentId, parentId);
        replyFormContainer.style.display = 'block';
        setupReplyFormSubmit(commentId, parentId);
      } else {
        replyFormContainer.style.display = replyFormContainer.style.display === 'none' ? 'block' : 'none';
      }
    });
  }
  
  // Create reply form
  function createReplyForm(commentId, parentId) {
    return `
      <div class="reply-form">
        <form id="reply-form-${commentId}-submit">
          <input type="hidden" id="reply-parent-id-${commentId}" value="${parentId || ''}">
          <input type="text" id="reply-name-${commentId}" placeholder="Your name (optional)" style="width: 100%; padding: 8px; margin-bottom: 10px; background: #000; border: 1px solid #333; color: white; font-family: Georgia, serif; font-size: 14px; box-sizing: border-box;">
          <label style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer; font-size: 0.9em;">
            <input type="checkbox" id="reply-anonymous-${commentId}" style="margin-right: 8px; width: 16px; height: 16px;">
            Post as Anonymous
          </label>
          <textarea id="reply-content-${commentId}" placeholder="Write a reply..." required style="width: 100%; padding: 8px; margin-bottom: 10px; background: #000; border: 1px solid #333; color: white; font-family: Georgia, serif; font-size: 14px; min-height: 80px; box-sizing: border-box; resize: vertical;"></textarea>
          <div style="display: flex; gap: 10px;">
            <button type="submit" style="background: white; color: black; border: none; padding: 8px 16px; font-family: Georgia, serif; font-size: 13px; cursor: pointer;">Post Reply</button>
            <button type="button" class="cancel-reply-btn" data-comment-id="${commentId}" style="background: transparent; color: #ccc; border: 1px solid #333; padding: 8px 16px; font-family: Georgia, serif; font-size: 13px; cursor: pointer;">Cancel</button>
          </div>
        </form>
      </div>
    `;
  }
  
  // Setup reply form submit
  function setupReplyFormSubmit(commentId, parentId) {
    const form = document.getElementById(`reply-form-${commentId}-submit`);
    if (!form) return;
    
    // Handle anonymous checkbox
    const anonymousCheck = document.getElementById(`reply-anonymous-${commentId}`);
    const nameInput = document.getElementById(`reply-name-${commentId}`);
    
    if (anonymousCheck && nameInput) {
      anonymousCheck.addEventListener('change', function() {
        nameInput.disabled = this.checked;
        if (this.checked) {
          nameInput.value = '';
        }
      });
    }
    
    // Handle cancel button
    const cancelBtn = form.querySelector('.cancel-reply-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        const replyFormContainer = document.getElementById(`reply-form-${commentId}`);
        if (replyFormContainer) {
          replyFormContainer.style.display = 'none';
          replyFormContainer.innerHTML = '';
        }
      });
    }
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameInput = document.getElementById(`reply-name-${commentId}`);
      const contentInput = document.getElementById(`reply-content-${commentId}`);
      const anonymousCheck = document.getElementById(`reply-anonymous-${commentId}`);
      
      const name = anonymousCheck.checked ? 'Anonymous' : (nameInput.value.trim() || 'Anonymous');
      const content = contentInput.value.trim();
      
      if (!content) {
        alert('Please enter a reply');
        return;
      }
      
      const comments = loadComments();
      const storedParentId = document.getElementById(`reply-parent-id-${commentId}`)?.value || '';
      const actualParentId = storedParentId || parentId;
      
      // Find the target comment to reply to
      let targetComment = null;
      let mainComment = null;
      
      // First, try to find it as a main comment
      targetComment = findCommentById(comments, commentId);
      
      if (targetComment) {
        // It's a main comment, add reply directly
        mainComment = targetComment;
      } else {
        // It might be a nested reply, need to find parent first
        for (let comment of comments) {
          const found = findCommentById([comment], commentId);
          if (found) {
            targetComment = found;
            mainComment = comment;
            break;
          }
        }
      }
      
      if (!targetComment) {
        console.error('Comment not found');
        return;
      }
      
      const reply = {
        id: Date.now().toString(),
        author: name,
        content: content,
        date: new Date().toISOString(),
        replies: [],
        isAuthor: name.toLowerCase() === AUTHOR_NAME.toLowerCase()
      };
      
      // Add reply to the target comment
      if (!targetComment.replies) targetComment.replies = [];
      targetComment.replies.push(reply);
      
      saveComments(comments);
      renderComments(comments);
    });
  }
  
  // Find comment by ID (recursive)
  function findCommentById(comments, id) {
    for (let comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  }
  
  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComments);
  } else {
    initComments();
  }
})();

