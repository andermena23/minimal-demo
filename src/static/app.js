document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-label"><strong>Participants</strong></p>
            <div class="participants" aria-live="polite"></div>
            <div class="participants-meta"><small class="participants-count">${details.participants.length} enrolled</small></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Remove participant (calls backend and refreshes list)
        async function removeParticipant(activityName, email) {
          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
              { method: 'DELETE' }
            );
            const result = await response.json();

            if (response.ok) {
              messageDiv.textContent = result.message || 'Participant removed';
              messageDiv.className = 'info';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 3000);
              // Refresh the activities to reflect the change
              await fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          } catch (error) {
            messageDiv.textContent = 'Failed to remove participant. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            console.error('Error removing participant:', error);
          }
        }

        // Render participant avatars with removable 'X' controls
        (function renderParticipants(container, participants) {
          const participantsDiv = container.querySelector('.participants');

          function getInitials(email) {
            const name = email.split('@')[0];
            const parts = name.split(/[\.\-_]/).filter(Boolean);
            if (parts.length === 0) return email[0]?.toUpperCase() || '?';
            const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
            return initials;
          }

          participantsDiv.innerHTML = '';

          if (!participants || participants.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'participants-empty';
            empty.textContent = 'Be the first to join!';
            participantsDiv.appendChild(empty);
            return;
          }

          const maxVisible = 4;
          participants.slice(0, maxVisible).forEach(email => {
            const wrap = document.createElement('span');
            wrap.className = 'participant-wrap';

            const avatar = document.createElement('span');
            avatar.className = 'participant-avatar';
            avatar.textContent = getInitials(email);
            avatar.title = email;
            avatar.setAttribute('aria-label', email);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'participant-remove';
            removeBtn.title = `Remove ${email}`;
            removeBtn.setAttribute('aria-label', `Remove ${email}`);
            removeBtn.textContent = '×';

            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              removeParticipant(name, email);
            });

            wrap.appendChild(avatar);
            wrap.appendChild(removeBtn);
            participantsDiv.appendChild(wrap);
          });

          if (participants.length > maxVisible) {
            const more = document.createElement('span');
            more.className = 'participant-count';
            more.textContent = `+${participants.length - maxVisible}`;
            more.title = `${participants.length} participants`;
            participantsDiv.appendChild(more);
          }
        })(activityCard, details.participants);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
