package com.tunebox.app.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.tunebox.app.R
import com.tunebox.app.databinding.ItemYoutubeResultBinding
import com.tunebox.app.youtube.YouTubeResult

class YouTubeResultAdapter(
    private val onDownloadClick: (YouTubeResult) -> Unit
) : ListAdapter<YouTubeResult, YouTubeResultAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemYoutubeResultBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(
        private val binding: ItemYoutubeResultBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(result: YouTubeResult) {
            binding.tvTitle.text = result.title
            binding.tvChannel.text = result.channel
            binding.tvDuration.text = result.duration

            Glide.with(binding.root.context)
                .load(result.thumbnailUrl)
                .placeholder(R.drawable.ic_music_note)
                .centerCrop()
                .into(binding.ivThumbnail)

            binding.btnDownload.setOnClickListener { onDownloadClick(result) }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<YouTubeResult>() {
        override fun areItemsTheSame(oldItem: YouTubeResult, newItem: YouTubeResult) =
            oldItem.videoId == newItem.videoId
        override fun areContentsTheSame(oldItem: YouTubeResult, newItem: YouTubeResult) =
            oldItem == newItem
    }
}
